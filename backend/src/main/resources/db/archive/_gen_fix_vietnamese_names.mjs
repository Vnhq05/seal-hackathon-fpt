/**
 * Generate fix_vietnamese_name_mojibake.sql from canonical demo names.
 * Run: node _gen_fix_vietnamese_names.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HISTORY_NAMES = [
  ["Nguyễn Hoàng Minh", "nguyen.hoang.minh"],
  ["Trần Thu Hà", "tran.thu.ha"],
  ["Lê Quang Huy", "le.quang.huy"],
  ["Phạm Ngọc Anh", "pham.ngoc.anh"],
  ["Hoàng Đức Anh", "hoang.duc.anh"],
  ["Vũ Minh Châu", "vu.minh.chau"],
  ["Đặng Thanh Tùng", "dang.thanh.tung"],
  ["Bùi Thị Lan", "bui.thi.lan"],
  ["Ngô Văn Khoa", "ngo.van.khoa"],
  ["Đỗ Hải Yến", "do.hai.yen"],
  ["Lý Quốc Bảo", "ly.quoc.bao"],
  ["Mai Phương Thảo", "mai.phuong.thao"],
  ["Trịnh Nhật Nam", "trinh.nhat.nam"],
  ["Phan Gia Bảo", "phan.gia.bao"],
  ["Huỳnh Khánh Vy", "huynh.khanh.vy"],
  ["Võ Thanh Phong", "vo.thanh.phong"],
  ["Đinh Ngọc Mai", "dinh.ngoc.mai"],
  ["Cao Minh Tuấn", "cao.minh.tuan"],
  ["Lương Thị Hương", "luong.thi.huong"],
  ["Tạ Đức Long", "ta.duc.long"],
  ["Hồ Quang Vinh", "ho.quang.vinh"],
  ["Chu Thị Mỹ", "chu.thi.my"],
  ["Đoàn Anh Khoa", "doan.anh.khoa"],
  ["Lâm Thanh Trúc", "lam.thanh.truc"],
  ["Tống Minh Đức", "tong.minh.duc"],
  ["Nghiêm Hà My", "nghiem.ha.my"],
  ["Quách Nhật Hào", "quach.nhat.hao"],
];

const STAFF = [
  ["tran.thanh.ha@fpt.edu.vn", "Trần Thanh Hà"],
  ["nguyen.van.duc@fpt.edu.vn", "Nguyễn Văn Đức"],
  ["le.thi.mai.anh@fpt.edu.vn", "Lê Thị Mai Anh"],
  ["vo.thi.huong@fpt.edu.vn", "Võ Thị Hương"],
  ["pham.quoc.bao@fpt.edu.vn", "Phạm Quốc Bảo"],
  ["tran.minh.khang@fpt.edu.vn", "Trần Minh Khang"],
  ["nguyen.thi.lan@fpt.edu.vn", "Nguyễn Thị Lan"],
];

const suffixes = ["", ".summer26", ".closing26", ".preview26"];
const esc = (s) => String(s).replace(/'/g, "''");

const lines = [];
lines.push("-- Fix Vietnamese full_name mojibake caused by sqlcmd without -f 65001.");
lines.push("-- Seed SQL is UTF-8-correct; applying without code page 65001 stores Latin-1 garbage.");
lines.push("-- Run:");
lines.push("--   sqlcmd -S localhost,1433 -U sa -P <pwd> -C -d SEAL -f 65001 -i fix_vietnamese_name_mojibake.sql");
lines.push("SET NOCOUNT ON;");
lines.push("SET QUOTED_IDENTIFIER ON;");
lines.push("DECLARE @now DATETIME2 = SYSUTCDATETIME();");
lines.push("DECLARE @fixed INT = 0;");
lines.push("");

for (const [email, name] of STAFF) {
  lines.push(
    `UPDATE users SET full_name = N'${esc(name)}', updated_at = @now WHERE email = N'${email}'; SET @fixed += @@ROWCOUNT;`,
  );
}

for (const [name, base] of HISTORY_NAMES) {
  for (const suf of suffixes) {
    const email = `${base}${suf}@fpt.edu.vn`;
    lines.push(
      `UPDATE users SET full_name = N'${esc(name)}', updated_at = @now WHERE email = N'${email}'; SET @fixed += @@ROWCOUNT;`,
    );
  }
}

lines.push("");
lines.push("SELECT @fixed AS rows_updated;");
lines.push(
  "SELECT email, full_name FROM users WHERE email IN (" +
    "N'nguyen.hoang.minh.preview26@fpt.edu.vn'," +
    "N'tran.thu.ha.preview26@fpt.edu.vn'," +
    "N'le.quang.huy.preview26@fpt.edu.vn'," +
    "N'tran.thanh.ha@fpt.edu.vn'" +
    ") ORDER BY email;",
);

const out = path.join(__dirname, "fix_vietnamese_name_mojibake.sql");
fs.writeFileSync(out, "\uFEFF" + lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${out} (${lines.length} lines)`);
