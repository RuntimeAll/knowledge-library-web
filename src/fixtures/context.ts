// Selector fixtures only; no production textbook or point identities.
export interface ContextBook {
  value: string;
  label: string;
  subject: string;
  chapters: { value: string; label: string; points: string[] }[];
}
export const contextBooks: ContextBook[] = [
  {
    value: "人教版七上",
    label: "人教版 · 七年级上册",
    subject: "数学",
    chapters: [
      {
        value: "有理数",
        label: "第一章 · 有理数",
        points: ["有理数运算", "正负数的意义"],
      },
      {
        value: "整式",
        label: "第二章 · 整式",
        points: ["整式的加减", "同类项"],
      },
    ],
  },
  {
    value: "人教版六上",
    label: "人教版 · 六年级上册",
    subject: "数学",
    chapters: [
      { value: "圆", label: "第五单元 · 圆", points: ["圆的周长", "圆的面积"] },
    ],
  },
  {
    value: "浙教版七上",
    label: "浙教版 · 七年级上册",
    subject: "科学",
    chapters: [
      {
        value: "科学入门",
        label: "第一章 · 科学入门",
        points: ["观察与测量", "实验记录"],
      },
    ],
  },
];
