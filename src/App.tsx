import { useState, useEffect, useRef } from 'react';
import { Calendar, Download, Plus, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface WorshipData {
  date: string;
  preacher: string;
  bibleText: string;
  sermonTitle: string;
  service1Male: string;
  service1Female: string;
  service2Male: string;
  service2Female: string;
  youthDept: string;
  teenDept: string;
  childDept: string;
  infantDept: string;
  registrants: string[];
  visitors: { name: string; referrer: string }[];
  service1Prayer: string;
  service2Prayer: string;
  service1Worship: string;
  service2Worship: string;
}

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<WorshipData>({
    date: new Date().toISOString().split('T')[0],
    preacher: '이수정 담임목사',
    bibleText: '',
    sermonTitle: '',
    service1Male: '',
    service1Female: '',
    service2Male: '',
    service2Female: '',
    youthDept: '',
    teenDept: '',
    childDept: '',
    infantDept: '',
    registrants: [],
    visitors: [],
    service1Prayer: '',
    service2Prayer: '',
    service1Worship: '',
    service2Worship: '',
  });

  const [newRegistrant, setNewRegistrant] = useState('');
  const [newVisitor, setNewVisitor] = useState({ name: '', referrer: '' });

  useEffect(() => {
    const saved = localStorage.getItem('worshipLog');
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('worshipLog', JSON.stringify(data));
  }, [data]);

  const updateField = (field: keyof WorshipData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const parseNumber = (value: string): number => {
    const num = parseInt(value) || 0;
    return num;
  };

  const service1Total = parseNumber(data.service1Male) + parseNumber(data.service1Female);
  const service2Total = parseNumber(data.service2Male) + parseNumber(data.service2Female);
  const mainServiceTotal = service1Total + service2Total;

  const deptTotal =
    parseNumber(data.youthDept) +
    parseNumber(data.teenDept) +
    parseNumber(data.childDept) +
    parseNumber(data.infantDept);

  const grandTotal = mainServiceTotal + deptTotal;

  const addRegistrant = () => {
    if (newRegistrant.trim()) {
      setData((prev) => ({
        ...prev,
        registrants: [...prev.registrants, newRegistrant.trim()],
      }));
      setNewRegistrant('');
    }
  };

  const removeRegistrant = (index: number) => {
    setData((prev) => ({
      ...prev,
      registrants: prev.registrants.filter((_, i) => i !== index),
    }));
  };

  const addVisitor = () => {
    if (newVisitor.name.trim()) {
      setData((prev) => ({
        ...prev,
        visitors: [...prev.visitors, { ...newVisitor }],
      }));
      setNewVisitor({ name: '', referrer: '' });
    }
  };

  const removeVisitor = (index: number) => {
    setData((prev) => ({
      ...prev,
      visitors: prev.visitors.filter((_, i) => i !== index),
    }));
  };

  const saveAsImage = async () => {
    if (contentRef.current) {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `예배일지_${data.date}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div ref={contentRef} className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-blue-900 text-white py-6 px-6 text-center">
            <h1 className="text-3xl font-bold">예배일지</h1>
            <p className="text-blue-200 text-sm mt-2">타슈켄트 한인교회</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-5 space-y-4">
              <h2 className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-2">
                예배 정보
              </h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    날짜
                  </label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설교자</label>
                  <input
                    type="text"
                    value={data.preacher}
                    onChange={(e) => updateField('preacher', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">성경 본문</label>
                  <input
                    type="text"
                    value={data.bibleText}
                    onChange={(e) => updateField('bibleText', e.target.value)}
                    placeholder="예: 요한복음 3:16"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설교 제목</label>
                  <input
                    type="text"
                    value={data.sermonTitle}
                    onChange={(e) => updateField('sermonTitle', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-5 space-y-4">
              <h2 className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-2">
                대예배 출석
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-800 mb-3">1부 예배</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">남</label>
                      <input
                        type="number"
                        value={data.service1Male}
                        onChange={(e) => updateField('service1Male', e.target.value)}
                        className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">여</label>
                      <input
                        type="number"
                        value={data.service1Female}
                        onChange={(e) => updateField('service1Female', e.target.value)}
                        className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">소계</label>
                      <div className="w-full px-3 py-3 bg-blue-100 border-2 border-blue-300 rounded-lg text-lg font-bold text-center text-blue-900">
                        {service1Total}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-800 mb-3">2부 예배</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">남</label>
                      <input
                        type="number"
                        value={data.service2Male}
                        onChange={(e) => updateField('service2Male', e.target.value)}
                        className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">여</label>
                      <input
                        type="number"
                        value={data.service2Female}
                        onChange={(e) => updateField('service2Female', e.target.value)}
                        className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">소계</label>
                      <div className="w-full px-3 py-3 bg-blue-100 border-2 border-blue-300 rounded-lg text-lg font-bold text-center text-blue-900">
                        {service2Total}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900 text-white p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">대예배 총원</span>
                    <span className="text-2xl font-bold">{mainServiceTotal}명</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 space-y-4">
              <h2 className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-2">
                부서별 보고
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">청년부</label>
                  <input
                    type="number"
                    value={data.youthDept}
                    onChange={(e) => updateField('youthDept', e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">중고등부</label>
                  <input
                    type="number"
                    value={data.teenDept}
                    onChange={(e) => updateField('teenDept', e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">유초등부</label>
                  <input
                    type="number"
                    value={data.childDept}
                    onChange={(e) => updateField('childDept', e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">유아부</label>
                  <input
                    type="number"
                    value={data.infantDept}
                    onChange={(e) => updateField('infantDept', e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg text-center"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-900 text-white p-5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">금주 주일 전체 출석</span>
                <span className="text-3xl font-bold">{grandTotal}명</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 space-y-4">
              <h2 className="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-2">
                상세 기록
              </h2>

              <div>
                <h3 className="font-semibold text-blue-800 mb-3">등록자</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRegistrant}
                    onChange={(e) => setNewRegistrant(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRegistrant()}
                    placeholder="이름 입력"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                  />
                  <button
                    onClick={addRegistrant}
                    className="bg-blue-900 text-white px-5 py-3 rounded-lg hover:bg-blue-800 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {data.registrants.length > 0 && (
                  <div className="space-y-2">
                    {data.registrants.map((name, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <span className="text-lg">{name}</span>
                        <button
                          onClick={() => removeRegistrant(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-blue-800 mb-3">방문자</h3>
                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    value={newVisitor.name}
                    onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                    placeholder="방문자 이름"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVisitor.referrer}
                      onChange={(e) => setNewVisitor({ ...newVisitor, referrer: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && addVisitor()}
                      placeholder="인도자 (비고)"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                    />
                    <button
                      onClick={addVisitor}
                      className="bg-blue-900 text-white px-5 py-3 rounded-lg hover:bg-blue-800 transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {data.visitors.length > 0 && (
                  <div className="space-y-2">
                    {data.visitors.map((visitor, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <div>
                          <span className="text-lg font-medium">{visitor.name}</span>
                          {visitor.referrer && (
                            <span className="text-sm text-gray-600 ml-2">
                              (인도: {visitor.referrer})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeVisitor(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-blue-800 mb-3">예배 위원</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">1부 기도</label>
                    <input
                      type="text"
                      value={data.service1Prayer}
                      onChange={(e) => updateField('service1Prayer', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">2부 기도</label>
                    <input
                      type="text"
                      value={data.service2Prayer}
                      onChange={(e) => updateField('service2Prayer', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">1부 찬양</label>
                    <input
                      type="text"
                      value={data.service1Worship}
                      onChange={(e) => updateField('service1Worship', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">2부 찬양</label>
                    <input
                      type="text"
                      value={data.service2Worship}
                      onChange={(e) => updateField('service2Worship', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pb-6">
          <button
            onClick={saveAsImage}
            className="w-full bg-white text-blue-900 font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition flex items-center justify-center gap-3 text-lg"
          >
            <Download className="w-6 h-6" />
            이미지로 저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
