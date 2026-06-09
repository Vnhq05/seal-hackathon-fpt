/* ----------------------------------------------------------------------------
 * campuses.ts — danh sách campus FPT có sẵn để chọn khi tạo/sửa cuộc thi.
 * Dùng chung cho wizard tạo cuộc thi và dialog sửa ở Event Control.
 * -------------------------------------------------------------------------- */
export const CAMPUSES = [
  "FPT University Hoa Lac",
  "FPT University Ho Chi Minh",
  "FPT University Da Nang",
  "FPT University Can Tho",
  "FPT University Quy Nhon",
] as const;

export type Campus = (typeof CAMPUSES)[number];
