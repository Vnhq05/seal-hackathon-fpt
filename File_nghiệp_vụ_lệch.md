# PHÂN TÍCH CÁC PHẦN BỊ LỆCH NGHIỆP VỤ — SEAL HACKATHON

> File này chỉ ghi các phần **bị lệch** giữa report hệ thống hiện tại và nghiệp vụ gốc của cuộc thi SEAL Hackathon Spring 2026.
> Không bao gồm phần thiếu chức năng, checklist triển khai, hoặc đề xuất AS2 nâng cao.

---

## 1. Lệch tổng thể: hệ thống đang quá tổng quát

### Hiện tại

Report hệ thống hiện tại đang mô tả một nền tảng quản lý hackathon tổng quát với nhiều module:

- Auth / User
- Event
- Team
- Submission
- Judging
- Ranking
- Notification
- Audit
- Dispute
- Mentor portal
- Judge portal
- Admin portal
- Staff portal

### Nghiệp vụ gốc

Nghiệp vụ gốc tập trung vào một cuộc thi cụ thể:

**SEAL Hackathon Spring 2026 – Mastering Domain-Specific AI RAG Systems**

Luồng chính là:

```text
Tạo cuộc thi
→ Đăng ký đội
→ Chia Track/Bảng
→ Bốc thăm chủ đề
→ Thi đấu
→ Nộp slide/sản phẩm
→ Chấm điểm vòng bảng
→ Chọn đội vào chung kết
→ Chấm chung kết
→ Công bố giải thưởng/bảng xếp hạng
```

### Phần bị lệch

Hệ thống hiện tại đang đi theo hướng **generic hackathon platform**, trong khi nghiệp vụ gốc cần bám sát format cụ thể của cuộc thi:

```text
Event → Track/Bảng → Team → Submission → Preliminary Scoring → Finalist Selection → Final Scoring → Award
```

Nếu không chỉnh, hệ thống có thể có nhiều chức năng nhưng vẫn bị xem là lệch nghiệp vụ vì không phản ánh đúng format cuộc thi thật.

---

## 2. Lệch về vai trò người dùng

### Hiện tại

Report hệ thống hiện tại có nhiều vai trò:

```text
FPT Student
External Student
Mentor
Judge
Lecturer
Event Coordinator
System Admin
Staff / Organizer
Participant
```

Frontend cũng chia nhiều portal:

```text
Participant Portal
Staff / Organizer Portal
Admin Portal
Mentor Portal
Judge Portal
```

### Nghiệp vụ gốc

Actor chính trong nghiệp vụ gốc gồm:

```text
Admin / BTC
Coordinator
Student / Participant
Team Leader
Judge / BGK
Public User
```

### Phần bị lệch

Các vai trò hiện tại đang bị phình ra và có nguy cơ trùng nghĩa:

| Vai trò hiện tại | Vấn đề lệch |
|---|---|
| Mentor | Nghiệp vụ gốc không xem mentor là actor bắt buộc trong core flow |
| Lecturer | Chưa có định nghĩa quyền rõ trong nghiệp vụ gốc |
| Staff / Organizer / Coordinator | Dễ bị trùng vai trò |
| Team Leader | Không nên là role hệ thống riêng, chỉ nên là trạng thái trong team |
| Judge / Mentor portal | Có thể dư nếu chưa map rõ quyền và luồng nghiệp vụ |

### Hướng đúng hơn

MVP nên gom vai trò về:

```text
PUBLIC
STUDENT
ADMIN
COORDINATOR
JUDGE
```

Team Leader nên nằm trong:

```text
TeamMember.isLeader = true
```

Không nên tạo role riêng là `TEAM_LEADER`.

---

## 3. Lệch về trạng thái cuộc thi

### Hiện tại

Report có nhiều cách gọi trạng thái khác nhau:

```text
DRAFT → ACTIVE → COMPLETED / CANCELLED
```

Có chỗ khác lại nhắc đến:

```text
Open
Scoring
Closed
```

### Nghiệp vụ gốc

Nghiệp vụ gốc đề xuất trạng thái rõ hơn:

```text
Draft
Open Registration
Closed Registration
Running
Scoring
Finished
```

### Phần bị lệch

Trạng thái `ACTIVE` quá mơ hồ. Nó không thể hiện rõ event đang ở giai đoạn nào:

- Đang mở đăng ký?
- Đã khóa đăng ký?
- Đang thi?
- Đang chấm?
- Đã công bố kết quả?

### Hướng đúng hơn

Nên chuẩn hóa enum:

```text
DRAFT
OPEN_REGISTRATION
CLOSED_REGISTRATION
RUNNING
SCORING
FINISHED
CANCELLED
```

Việc này quan trọng vì status quyết định các quyền sau:

| Status | Quyền nghiệp vụ |
|---|---|
| OPEN_REGISTRATION | Cho phép tạo team, mời thành viên |
| CLOSED_REGISTRATION | Không cho đổi thành viên |
| RUNNING | Cho phép nộp bài |
| SCORING | Cho phép judge chấm |
| FINISHED | Cho phép xem kết quả đã công bố |

---

## 4. Lệch về Track/Bảng

### Hiện tại

Report hiện tại có nhắc đến `tracks`, nhưng track đang giống một phần mở rộng của frontend/admin, chưa được xem là lõi nghiệp vụ.

Có chỗ report cho participant chọn track khi đăng ký.

### Nghiệp vụ gốc

Nghiệp vụ gốc đã chốt hướng đơn giản:

```text
1 Event có nhiều Track
1 Track tương đương 1 bảng
1 Track có tối đa 8 đội
Mỗi Track có 1 chủ đề riêng
```

Ngoài ra:

```text
Mỗi cuộc thi có tối đa 3 Track
Đội được chia Track ngẫu nhiên hoặc do BTC bốc thăm
BTC đảm bảo chia bảng công bằng
```

### Phần bị lệch

| Hiện tại | Đúng theo nghiệp vụ gốc |
|---|---|
| Track là phần phụ | Track là lõi của cuộc thi |
| Participant có thể chọn track | BTC/Coordinator nên chia track hoặc bốc thăm |
| Chưa nhấn mạnh max team/track | Mỗi track tối đa 8 đội |
| Chưa rõ topic theo track | Mỗi track có chủ đề riêng |
| Chấm điểm thiên về round chung | Vòng bảng phải chấm theo track/bảng |

### Hướng đúng hơn

Mô hình nên là:

```text
Track
- id
- eventId
- name
- topic
- maxTeams

TeamTrackAssignment
- id
- teamId
- trackId
- assignedAt
- method: RANDOM / MANUAL
```

---

## 5. Lệch về vòng bảng và chung kết

### Hiện tại

Report hiện tại dùng khái niệm `round`, `ranking`, `advancement cutoff`, nhưng chưa thể hiện rõ format:

```text
Vòng bảng → chọn Top 6 → chung kết → trao giải
```

### Nghiệp vụ gốc

Cuộc thi có 2 giai đoạn chấm chính:

```text
Vòng bảng:
- Chấm các đội trong từng Track/Bảng
- Mỗi Track lấy Top 2
- Tổng cộng chọn 6 đội vào chung kết

Chung kết:
- Chấm Top 6
- Điểm chung kết quyết định giải thưởng
```

### Phần bị lệch

| Hiện tại | Đúng theo nghiệp vụ gốc |
|---|---|
| Round chung chung | Cần phân biệt PRELIMINARY và FINAL |
| Advancement cutoff chung | Cần logic Top 2 mỗi track + đủ 6 đội |
| Ranking chung | Cần ranking vòng bảng theo track và ranking chung kết |
| Chưa rõ finalist | Cần entity FinalistSelection |
| Chưa rõ award theo final score | Giải thưởng dựa trên điểm chung kết |

### Hướng đúng hơn

Nên có:

```text
RoundType:
- PRELIMINARY
- FINAL
```

Và entity:

```text
FinalistSelection
- id
- eventId
- teamId
- preliminaryRank
- selectedReason
- selectedAt
```

Logic đúng:

```text
Mỗi Track lấy Top 2 team có điểm vòng bảng cao nhất.
Nếu tổng số đội chưa đủ 6, lấy thêm đội có điểm cao nhất còn lại.
Nếu đồng điểm, ưu tiên team nộp bài sớm hơn.
Nếu vẫn hòa, BTC dùng penalty evaluation.
```

---

## 6. Lệch về tiêu chí chấm điểm

### Hiện tại

Report hiện tại chủ yếu nói:

```text
Criteria weights = 100%
```

Nhưng chưa thể hiện rõ 2 bộ rubric khác nhau cho vòng bảng và chung kết.

### Nghiệp vụ gốc

Nghiệp vụ gốc có rubric riêng cho từng vòng.

#### Rubric vòng bảng

| Tiêu chí | Trọng số |
|---|---:|
| Tính chính xác và phù hợp với Domain | 30% |
| Kiến trúc Agentic RAG & Giải thuật | 30% |
| Ý tưởng & Thuyết trình | 15% |
| Khả năng thực thi & tính sáng tạo | 15% |
| Trải nghiệm người dùng & giao diện tương tác | 10% |

#### Rubric vòng chung kết

| Tiêu chí | Trọng số |
|---|---:|
| Chất lượng xử lý & truy xuất dữ liệu | 30% |
| Độ tin cậy & chống ảo giác | 20% |
| Tư duy Agent & xử lý đa tầng | 20% |
| Tính thực tế & tối ưu vận hành | 20% |
| Khả năng mở rộng & sáng tạo | 10% |

### Phần bị lệch

Hệ thống hiện tại mới dừng ở tiêu chí chấm điểm chung, chưa buộc rõ:

```text
Rubric vòng bảng khác rubric chung kết
```

### Hướng đúng hơn

Entity tiêu chí nên có:

```text
ScoringCriterion
- id
- eventId
- roundType: PRELIMINARY / FINAL
- name
- description
- weightPercent
- maxScore
```

---

## 7. Lệch về submission/nộp bài

### Hiện tại

Report hiện tại mô tả submission gồm:

```text
GitHub URL
Demo URL
PDF
PDF ≤ 5MB
PDF ≤ 2 trang
Demo URL whitelist
GitHub URL validation
```

### Nghiệp vụ gốc

Nghiệp vụ gốc yêu cầu:

```text
Slide
Source code URL
Demo URL hoặc link sản phẩm
```

Đồng thời:

```text
Không chấp nhận Google Drive hoặc dịch vụ cá nhân cho mã nguồn/kết quả
Chỉ Team Leader nên được quyền nộp bài chính thức
```

### Phần bị lệch

| Hiện tại | Đúng theo nghiệp vụ gốc |
|---|---|
| PDF là trọng tâm | Slide mới là trọng tâm |
| GitHub URL bắt buộc | Source có thể là GitHub/Jira/Confluence/Notion hoặc tương đương |
| Demo whitelist có thể gồm Drive | Source/kết quả không nên để Google Drive |
| Submission theo round chung | Cần phân biệt vòng bảng/chung kết |

### Hướng đúng hơn

Nên đổi về:

```text
Submission
- id
- eventId
- teamId
- roundType
- slideUrl
- sourceCodeUrl
- demoUrl
- submittedBy
- submittedAt
- status
```

Rule nên ghi rõ:

```text
Google Drive có thể dùng cho slide/demo nếu BTC cho phép,
nhưng không dùng làm nơi chứa source code chính.
```

---

## 8. Lệch về lịch trình và milestone

### Hiện tại

Report hiện tại có event date, round deadline, submission deadline, scoring deadline.

### Nghiệp vụ gốc

Nghiệp vụ gốc có lịch trình cụ thể:

| Mốc | Thời gian |
|---|---|
| Đăng ký | 15/03/2026 - 25/03/2026 |
| Workshop | 09/04/2026 |
| Khai mạc, bốc thăm, họp đội | 11/04/2026 |
| Thi đấu, chấm vòng bảng, chung kết | 12/04/2026 |

Trong ngày thi:

| Giai đoạn | Thời gian |
|---|---|
| Thi đấu chính thức | 07h00 - 14h00 |
| Chấm vòng bảng | 14h00 - 15h30 |
| Chung kết | 15h30 - 17h00 |
| Trao giải | 17h00 - 18h00 |

### Phần bị lệch

Hệ thống hiện tại đang biến lịch trình thành các deadline của round. Nhưng nghiệp vụ gốc cần một module lịch trình rõ hơn:

```text
Workshop
Opening
Topic Drawing
Competition Time
Preliminary Scoring
Final Round
Award Ceremony
```

### Hướng đúng hơn

Nên có:

```text
EventSchedule
- id
- eventId
- title
- description
- startTime
- endTime
- type
```

---

## 9. Lệch về assign mentor/judge

### Hiện tại

Report hiện tại có assign judge, assign mentor, nhưng chủ yếu nói theo event hoặc round.

### Nghiệp vụ gốc và góp ý mới

Góp ý mới yêu cầu:

```text
Assign mentor qua page riêng
Assign judge qua page riêng
Sau khi tạo event xong mới assign lecturer/mentor/judge
Phân công mentor theo track
Phân công judge theo track và vòng
Judge final round riêng
```

### Phần bị lệch

| Hiện tại | Đúng hơn |
|---|---|
| Assign nằm chung trong event config | Nên tách page riêng |
| Assign mentor/judge theo event/round chung | Mentor theo track, judge theo track + round |
| Chưa rõ final judge | Judge chung kết cần phân riêng |
| Chưa rõ conflict mentor/judge | Judge không được chấm team mình mentor |

### Hướng đúng hơn

```text
MentorAssignment
- eventId
- trackId
- mentorId

JudgeAssignment
- eventId
- trackId
- roundType
- judgeId
```

Với final round:

```text
roundType = FINAL
trackId = null
```

hoặc dùng `trackId` optional.

---

## 10. Lệch về scoring/chấm điểm

### Hiện tại

Report hiện tại có scoring theo round, judge scoring, lock score, comment, variance.

### Nghiệp vụ đúng hơn

Judge cần chấm theo:

```text
Track
Round
Rubric của round
Team được assign
```

Đồng thời:

```text
Judge không được chấm team mình mentor
```

### Phần bị lệch

| Hiện tại | Đúng hơn |
|---|---|
| Scoring theo round chung | Scoring theo track + round |
| Judge có thể thấy nhiều submission | Judge chỉ thấy team được phân công |
| Conflict detection có nhưng chưa gắn track/mentor rõ | Phải kiểm tra mentor-team trước khi cho chấm |
| Score deviation chưa thành luồng review rõ | Nên có ScoreReviewRequest |

### Hướng đúng hơn

```text
Score
- id
- eventId
- teamId
- judgeId
- trackId
- roundType
- totalScore
- comment
- status

ScoreDetail
- id
- scoreId
- criterionId
- rawScore
- weightedScore
```

---

## 11. Lệch về điều chỉnh điểm

### Hiện tại

Report có nhắc scoring reopen, judge variance, analytics, nhưng chưa rõ luồng request điều chỉnh điểm khi điểm lệch quá cao.

### Góp ý mới

Nếu hệ thống tính ra độ lệch điểm quá lớn thì phải gửi yêu cầu điều chỉnh điểm.

### Phần bị lệch

Không nên để hệ thống tự động sửa điểm. Đúng hơn là hệ thống chỉ phát hiện lệch và tạo request review.

### Hướng đúng hơn

```text
1. Judge chấm xong
2. Hệ thống tính độ lệch điểm giữa các judge
3. Nếu lệch quá ngưỡng → tạo ScoreReviewRequest
4. Judge/Coordinator xem request
5. Judge xác nhận giữ điểm hoặc sửa điểm
6. Hệ thống lưu audit log
```

Entity:

```text
ScoreReviewRequest
- id
- eventId
- teamId
- roundType
- reason
- deviationValue
- status: OPEN / RESOLVED / IGNORED
- createdAt
```

Ngưỡng đơn giản:

```text
Nếu maxScore - minScore >= 25 điểm
→ tạo request review
```

---

## 12. Lệch về leaderboard/công bố kết quả

### Hiện tại

Report hiện tại có leaderboard/ranking/publish, nhưng đang thiên về kết quả chung.

### Góp ý mới và nghiệp vụ gốc

Cần:

```text
Xem thông tin tiến độ cuộc thi
Công bố kết quả từng track
Công bố kết quả từng round
Ranking vòng bảng theo track
Final ranking sau chung kết
```

### Phần bị lệch

| Hiện tại | Đúng hơn |
|---|---|
| Leaderboard chung | Leaderboard theo track/round |
| Ranking chung | Preliminary ranking và Final ranking |
| Publish chung | Publish theo track/round |
| Chưa rõ progress board | Cần xem tiến độ cuộc thi, không chỉ bảng điểm |

### Hướng đúng hơn

```text
GET /events/{eventId}/leaderboard?roundType=PRELIMINARY&trackId=...
GET /events/{eventId}/leaderboard?roundType=FINAL
POST /events/{eventId}/leaderboard/publish
```

Public user chỉ xem được khi:

```text
published = true
```

---

## 13. Lệch về team matching/tìm team

### Hiện tại

Report hiện tại có auto-matching và invitation, nhưng chưa thể hiện rõ nhu cầu tìm team theo role.

### Góp ý mới

Team thiếu người có thể note đang kiếm người có vai trò cần thiết. Người chưa có nhóm có thông tin vai trò như FE, BE. Tìm team không xem được thông tin thành viên, chỉ filter theo role team đang cần.

### Phần bị lệch

| Hiện tại | Đúng hơn |
|---|---|
| Team invitation chung | Cần thêm team recruiting |
| Auto-matching chung | Cần filter role đang cần |
| Có thể xem team | Không nên xem thông tin thành viên trong tìm team |
| Profile chưa rõ visibility | Cần public/private profile |

### Hướng đúng hơn

Team nên có:

```text
Team
- recruitmentNote
- neededRoles
- isRecruiting
```

Participant profile nên có:

```text
ParticipantProfile
- preferredRole
- skills
- bio
- portfolioUrl
- isLookingForTeam
- profileVisibility: PUBLIC / PRIVATE
```

Màn tìm team chỉ hiện:

```text
Team name
Số lượng hiện tại
Vai trò đang cần
Recruitment note
Button Request to Join
```

Không hiện:

```text
Email thành viên
SĐT
Thông tin cá nhân riêng tư
```

---

## 14. Lệch về sinh viên vãng lai

### Hiện tại

Report hiện tại có FPT Student và External Student, nhưng chưa rõ xác minh external student bằng email trường/tổ chức.

### Góp ý mới

Sinh viên vãng lai nhập bằng:

```text
email .edu
mail tổ chức
mail trường
```

Sau đó hệ thống gửi link đăng nhập qua mail giả lập.

### Phần bị lệch

Chỉ dùng `.edu` là không đủ vì trường Việt Nam thường dùng nhiều domain khác nhau:

```text
.edu.vn
@fpt.edu.vn
@fe.edu.vn
@hcmut.edu.vn
@student.hcmus.edu.vn
@uit.edu.vn
```

### Hướng đúng hơn

Nên có whitelist domain:

```text
AllowedEmailDomain
- id
- eventId
- domain
- schoolName
- type: FPT / INVITED_SCHOOL / ORGANIZATION
```

Và luồng:

```text
1. External student nhập email trường/tổ chức
2. Hệ thống kiểm tra domain hợp lệ
3. Hệ thống tạo login token
4. Hệ thống giả lập gửi mail bằng cách show link hoặc log console
5. User bấm link để xác thực / đăng nhập lần đầu
```

Không nên ghi là gửi mail thật nếu chưa có SMTP.

---

## 15. Lệch về rule/description

### Hiện tại

Report hiện tại chia nhiều business rule chi tiết.

### Góp ý mới

Rule có thể bỏ vào description, chỉ cần một khung text rồi paste vào.

### Phần bị lệch

Nếu đưa toàn bộ rule vào text thì hệ thống sẽ không enforce được rule.

Ví dụ nếu chỉ paste text:

```text
Đội trễ quá 60 phút bị loại
```

thì backend sẽ không tự biết để loại đội.

### Hướng đúng hơn

Nên chia thành 2 loại:

#### Rule dạng text

```text
Nội quy cuộc thi
Quy định đạo đức
Quy định bản quyền
Quy định đi trễ
Quy định trình bày
```

#### Rule hệ thống phải enforce

```text
Team size 3–5
Deadline đăng ký
Deadline nộp bài
Max team / track
Judge không chấm team mình mentor
Chỉ leader nộp bài
Không sửa điểm sau khi khóa
```

---

## 16. Lệch về award/giải thưởng

### Hiện tại

Report hiện tại có ranking và publish, nhưng award chưa phải module chính.

### Nghiệp vụ gốc

Cơ cấu giải thưởng cụ thể:

| Giải | Giá trị |
|---|---:|
| Giải Nhất | 7.000.000đ |
| Giải Nhì | 5.000.000đ |
| Giải Ba | 3.000.000đ |
| Khuyến khích | 1.500.000đ |
| Giấy chứng nhận | Tất cả thí sinh tham gia |

### Phần bị lệch

Nếu chỉ có ranking mà không có award, hệ thống chưa thể hiện đúng đầu ra cuối cùng của cuộc thi.

### Hướng đúng hơn

Nên có:

```text
Award
- id
- eventId
- name
- prizeAmount
- description

TeamAward
- id
- awardId
- teamId
- awardedAt
```

---

## 17. Lệch về review/feedback

### Hiện tại

Report hiện tại có notification, dispute, audit, nhưng chưa nhấn mạnh feedback/review từ người tham gia.

### Góp ý mới

Có review/feedback của người tham gia thì tốt.

### Phần bị lệch

Feedback không phải core flow, nhưng nếu làm AS2 thì nên có vì giúp hoàn thiện vận hành sau cuộc thi.

### Hướng đúng hơn

```text
ParticipantFeedback
- id
- eventId
- userId
- rating
- comment
- createdAt
```

Có thể phân loại:

```text
Feedback về event
Feedback về mentor
Feedback về judging
Feedback về platform
```

---

# Tổng kết các phần lệch chính

| STT | Phần lệch | Mức độ |
|---:|---|---|
| 1 | Hệ thống đang quá generic, chưa bám format SEAL Spring 2026 | Rất cao |
| 2 | Role bị phình và trùng nghĩa | Rất cao |
| 3 | Event status chưa rõ theo từng giai đoạn | Cao |
| 4 | Track chưa được xem là bảng thi cốt lõi | Rất cao |
| 5 | Chưa rõ vòng bảng → Top 6 → chung kết | Rất cao |
| 6 | Rubric chưa tách vòng bảng và chung kết | Cao |
| 7 | Submission lệch từ slide/source/demo sang GitHub/demo/PDF | Cao |
| 8 | Lịch trình đang bị giản lược thành deadline | Trung bình |
| 9 | Assign mentor/judge chưa tách theo track + round | Rất cao |
| 10 | Scoring chưa bám track + round | Rất cao |
| 11 | Điều chỉnh điểm chưa có luồng ScoreReviewRequest rõ | Cao |
| 12 | Leaderboard chưa tách track/round/final | Cao |
| 13 | Team matching chưa bám role cần tuyển | Trung bình |
| 14 | External student chưa rõ xác minh bằng domain email | Trung bình |
| 15 | Rule text chưa phân biệt rule mô tả và rule hệ thống enforce | Trung bình |
| 16 | Award chưa phải đầu ra chính | Trung bình |
| 17 | Feedback chưa được đưa vào luồng sau cuộc thi | Thấp |

---

# Kết luận

Các phần lệch nghiêm trọng nhất cần chỉnh trước là:

```text
1. Track = bảng
2. Vòng bảng → Top 6 → Chung kết
3. Rubric riêng cho vòng bảng và chung kết
4. Judge assignment theo track + round
5. Mentor assignment theo track
6. Scoring theo track + round
7. Leaderboard theo track/round/final
8. Event status rõ theo giai đoạn
9. Submission đúng: slide + source + demo
10. Award sau final ranking
```

Nếu không chỉnh các phần này, hệ thống vẫn có thể nhiều chức năng, nhưng sẽ không khớp với nghiệp vụ thật của SEAL Hackathon Spring 2026.
