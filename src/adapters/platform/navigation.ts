export const tabs = [
  "/pages/index/index",
  "/pages/records/index",
  "/pages/mine/index",
];
export function go(path: string) {
  const target = path.split("?")[0];
  if (tabs.includes(target)) return uni.switchTab({ url: target });
  return uni.navigateTo({ url: path });
}
export function back() {
  if (getCurrentPages().length > 1) uni.navigateBack();
  else uni.switchTab({ url: tabs[0] });
}
export function notify(title: string) {
  uni.showToast({ title, icon: "none" });
}
export function headerInset(): number {
  let top = uni.getSystemInfoSync().statusBarHeight || 0;
  // #ifdef MP-WEIXIN
  top += 40;
  // #endif
  return top;
}
