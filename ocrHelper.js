/**
 * ocrHelper.js
 * 청년부 출석부 - Gemini 3.6 Flash -> 3.5 Flash -> 3.5 Flash-lite 자동 폴백(Fallback) OCR 유틸리티
 */

// Gemini 모델 폴백 체인 (1순위: 3.6 Flash -> 2순위: 3.5 Flash -> 3순위: 3.5 Flash-lite)
const GEMINI_MODEL_CHAIN = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite'
];

// 기본 Gemini API 키 (Firebase Config / Google Cloud API Key)
function getProjectGeminiApiKey() {
    if (window.firebaseConfig && window.firebaseConfig.apiKey) {
        return window.firebaseConfig.apiKey;
    }
    return 'AIzaSyAX7b9Hhm2yCV-L-WrMUSpVw50QMpaSyLM';
}

// 청년부 출석부/교인카드 추출 전용 시스템 프롬프트
const OCR_SYSTEM_PROMPT = `너는 타슈켄트 한인교회 청년부 행정 시스템의 최고 수준 OCR 및 데이터 분석가야.
교인 등록 카드, 명단 표, 손글씨 출석표 이미지를 전달받아 모든 인원 정보를 정확히 추출한다.

결과값은 반드시 마크다운 코드블록(예: \`\`\`json) 없이 아래 순수 JSON 포맷으로 반환해야 한다:
{
  "documentType": "list" | "family" | "individual",
  "members": [
    {
      "name": "성도 이름",
      "phone": "전화번호 (숫자와 +만 남길 것)",
      "birth": "YYYY-MM-DD (생년월일. 불완전하면 연도만)",
      "role": "직분 (목사/장로/권사/안수집사/집사/성도/청년)",
      "residence": "거주지 ('타슈켄트' 또는 '그외')",
      "isResident": true,
      "company": "직장/학교 (있을 경우만)",
      "address": "주소 (있을 경우만)",
      "memo": "메모/특이사항"
    }
  ]
}

【데이터 추출 핵심 규칙】
1. [삭제/취소선 필터링]: 명단에서 취소선, X표시, 귀임/삭제 등의 표시가 있는 사람은 무조건 제외하라.
2. [전수 조사]: 표시가 없는 성도는 인원수 제한 없이 100% 모두 추출하라.
3. [이름 정상화]: 한국인 성명(예: 홍길동, 김철수)의 띄어쓰기를 지우고 2~4글자 한글 이름을 정확히 판별하라.
4. [직분 기본값]: 직분이 없거나 불분명하면 기본값 "성도"로 설정하라.
5. [전화번호]: 숫자와 + 기호만 남길 것.
6. [거주지]: '한국', '귀국' 등이 포함되어 있으면 '그외' (isResident: false), 그 외엔 '타슈켄트' (isResident: true).
7. 반드시 pure JSON 포맷만 반환하라.`;

/**
 * Gemini REST API 호출 (모델 1개 시도)
 */
async function callGeminiApi(modelName, apiKey, prompt, base64Image, mimeType = 'image/jpeg') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const contents = [
        {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType || 'image/jpeg',
                        data: base64Image
                    }
                }
            ]
        }
    ];

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status} (${modelName}): ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error(`${modelName} 응답에 텍스트 내용이 없습니다.`);
    }
    return text;
}

/**
 * 헬퍼: Gemini 응답에서 pure JSON 추출
 */
function extractJsonFromText(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Gemini 응답이 비어있거나 문자열이 아닙니다.');
    }

    // 1순위: ```json ... ``` 마크다운 코드블록
    const jsonBlock = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlock && jsonBlock[1]) return jsonBlock[1].trim();

    // 2순위: ``` ... ``` 코드블록
    const codeBlock = text.match(/```\s*([\s\S]*?)```/);
    if (codeBlock && codeBlock[1]) return codeBlock[1].trim();

    // 3순위: { ... } 또는 [ ... ] 텍스트
    const jsonObj = text.match(/[\{\[][\s\S]*[\}\]]/);
    if (jsonObj && jsonObj[0]) return jsonObj[0].trim();

    throw new Error('응답 텍스트에서 JSON 구조를 찾을 수 없습니다.');
}

/**
 * 헬퍼: 파싱된 JSON 규격화
 */
function normalizeOcrResult(parsed) {
    let members = [];
    if (parsed.members && Array.isArray(parsed.members)) {
        members = parsed.members;
    } else if (Array.isArray(parsed)) {
        members = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
        members = [parsed];
    }

    const cleanedMembers = members.map(m => {
        const rawName = (m.name || m.성명 || m.이름 || '').replace(/\s+/g, '').trim();
        return {
            name: rawName,
            phone: (m.phone || m.연락처 || m.전화번호 || '').replace(/[^0-9+]/g, ''),
            birth: m.birth || m.생년월일 || '',
            role: m.role || m.직분 || '성도',
            residence: m.residence || '타슈켄트',
            company: m.company || m.직장 || m.학교 || '',
            memo: m.memo || m.특이사항 || ''
        };
    }).filter(m => m.name.length > 0);

    return {
        documentType: parsed.documentType || 'list',
        members: cleanedMembers
    };
}

/**
 * 메인 OCR 분석 함수 (3.6 Flash -> 3.5 Flash -> 3.5 Flash-lite 자동 폴백 지원)
 * @param {string} base64Image - 순수 Base64 string
 * @param {string} apiKey - Gemini API 키
 * @param {string} mimeType - 이미지 MIME 타입 (기본 'image/jpeg')
 * @param {function} onStatusUpdate - Status callback (msg) => void
 * @returns {Promise<{ result: object, usedModel: string }>}
 */
async function analyzeImageWithGeminiFallback(base64Image, apiKey = null, mimeType = 'image/jpeg', onStatusUpdate = null) {
    const keyToUse = apiKey || getProjectGeminiApiKey();
    if (!keyToUse) {
        throw new Error('Gemini API 키가 설정되어 있지 않습니다.');
    }

    let lastError = null;

    for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
        const modelName = GEMINI_MODEL_CHAIN[i];
        const statusMsg = `🤖 [${i + 1}/${GEMINI_MODEL_CHAIN.length}] ${modelName} 모델 호출 시도 중...`;
        console.log(statusMsg);
        if (onStatusUpdate) onStatusUpdate(statusMsg);

        try {
            const rawText = await callGeminiApi(modelName, keyToUse, OCR_SYSTEM_PROMPT, base64Image, mimeType);
            const jsonStr = extractJsonFromText(rawText);
            const parsed = JSON.parse(jsonStr);
            const normalized = normalizeOcrResult(parsed);

            console.log(`✅ ${modelName} 분석 성공! 추출 인원: ${normalized.members.length}명`);
            return {
                result: normalized,
                usedModel: modelName
            };
        } catch (err) {
            console.warn(`⚠️ ${modelName} 시도 실패:`, err.message);
            lastError = err;
        }
    }

    throw new Error(`모든 Gemini 모델 시도가 실패했습니다. 마지막 오류: ${lastError?.message || '알 수 없는 오류'}`);
}

/**
 * File 객체를 Base64 및 MIME 타입으로 변환하는 유틸리티
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (!reader.result) {
                reject(new Error('파일 읽기에 실패했습니다.'));
                return;
            }
            const dataUrl = reader.result;
            const mimeType = file.type || 'image/jpeg';
            const base64 = dataUrl.replace(/^data:[a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
            resolve({ base64, mimeType });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}
