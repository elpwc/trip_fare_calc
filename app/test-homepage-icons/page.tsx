'use client';

import React from 'react';

// 测试用的成员数据（包含isSelf字段）
const testMembers = [
  { id: '1', name: '张三', participationCount: 5, description: '', isSelf: false },
  { id: '2', name: '李四', participationCount: 3, description: '', isSelf: true },
  { id: '3', name: '王五', participationCount: 8, description: '', isSelf: false },
  { id: '4', name: '赵六', participationCount: 2, description: '', isSelf: false },
  { id: '5', name: 'Alice', participationCount: 4, description: '', isSelf: false },
  { id: '6', name: 'Bob', participationCount: 6, description: '', isSelf: false },
];

type TripMember = {
  id: string;
  name: string;
  participationCount: number;
  description: string;
  isSelf: boolean;
};

const HomepageIconTest: React.FC = () => {
  // 根据名称生成不同的背景色
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-fuchsia-500',
      'bg-rose-500',
      'bg-sky-500',
    ];

    // 使用名称的字符码和来决定颜色
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // 获取显示文字（最多两个字符）
  const getDisplayText = (name: string) => {
    if (name.length <= 2) return name;
    // 如果是中文，取前两个字符
    if (/[\u4e00-\u9fa5]/.test(name)) {
      return name.substring(0, 2);
    }
    // 如果是英文，取前两个字符
    return name.substring(0, 2);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">一览页Icon样式测试</h1>

      {/* 参与者section样式测试 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">参与者列表样式</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {testMembers.map((member) => (
            <div key={member.id} className="flex min-w-16 flex-col items-center gap-2 text-center">
              <div className={`relative w-12 h-12 ${getBackgroundColor(member.name)} rounded-full flex items-center justify-center text-white font-bold`}>
                {getDisplayText(member.name)}
                {member.isSelf && (
                  <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                    我
                  </div>
                )}
              </div>
              <p className="max-w-18 truncate text-xs text-slate-700 dark:text-slate-300">{member.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 账单列表样式测试 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">账单列表样式</h2>
        <div className="bg-white rounded-lg p-4">
          <table className="min-w-full text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-[0.24em] text-slate-500">
              <tr>
                <th className="px-3 py-3">付钱人</th>
                <th className="px-3 py-3">金额</th>
                <th className="px-3 py-3">欠钱人</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-1">
                  <div className={`w-8 h-8 ${getBackgroundColor(testMembers[0].name)} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                    {getDisplayText(testMembers[0].name)}
                  </div>
                </td>
                <td className="px-3 py-1 font-semibold text-slate-900">¥100</td>
                <td className="px-3 py-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {testMembers.slice(1, 4).map((member) => (
                      <div key={member.id} className={`relative w-6 h-6 ${getBackgroundColor(member.name)} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                        {getDisplayText(member.name)}
                        {member.isSelf && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-orange-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px] font-bold">
                            我
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default HomepageIconTest;