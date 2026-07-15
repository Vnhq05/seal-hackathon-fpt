/* V0 baseline schema — dumped from live SEAL catalog (schema-only).
   Fail-fast: no IF OBJECT_ID guards. Empty DB only; existing DBs use Flyway baseline-on-migrate.
   Source generator: db/_incoming/generate_schema_ddl.sql
*/
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
CREATE TABLE [dbo].[advancements] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [round_id] uniqueidentifier NOT NULL,
    [status] varchar(255) NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__advancem__3213E83FACCFB58E] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKt3uvvbdb1k2266as1f3346fga] UNIQUE NONCLUSTERED ([team_id], [round_id])
  , CONSTRAINT [CK__advanceme__statu__36B12243] CHECK ([status]='ELIMINATED' OR [status]='ADVANCED')
);
GO
CREATE TABLE [dbo].[allowed_email_domains] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__allowed_emai__id__0B27A5C0] DEFAULT (newid()),
    [event_id] uniqueidentifier NULL,
    [domain] nvarchar(255) NOT NULL,
    [university_label] nvarchar(255) NULL,
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__allowed_e__creat__0C1BC9F9] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__allowed_e__updat__0D0FEE32] DEFAULT (getutcdate()),
    [created_by] varchar(255) NULL,
    [updated_by] varchar(255) NULL
  , CONSTRAINT [PK__allowed___3213E83F602B1C79] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_allowed_domain_event_domain] UNIQUE NONCLUSTERED ([event_id], [domain])
);
GO
CREATE TABLE [dbo].[audit_logs] (
    [id] uniqueidentifier NOT NULL,
    [action] varchar(100) NOT NULL,
    [actor_id] uniqueidentifier NOT NULL,
    [ip_address] varchar(45) NULL,
    [new_value] text NULL,
    [old_value] text NULL,
    [target_id] uniqueidentifier NULL,
    [target_type] varchar(100) NULL,
    [timestamp] datetime2(6) NOT NULL
  , CONSTRAINT [PK__audit_lo__3213E83FC9C2FBF2] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[competition_groups] (
    [id] uniqueidentifier NOT NULL,
    [track_id] uniqueidentifier NOT NULL,
    [name] nvarchar(255) NOT NULL,
    [created_at] datetime2(7) NOT NULL,
    [updated_at] datetime2(7) NULL,
    [created_by] nvarchar(255) NULL,
    [updated_by] nvarchar(255) NULL
  , CONSTRAINT [PK__competit__3213E83FC7523EF0] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_competition_group_track_name] UNIQUE NONCLUSTERED ([track_id], [name])
);
GO
CREATE TABLE [dbo].[criteria] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [description] nvarchar(1000) NULL,
    [name] nvarchar(255) NOT NULL,
    [sort_order] int NOT NULL,
    [weight] int NOT NULL,
    [round_id] uniqueidentifier NOT NULL,
    [min_score] int NOT NULL CONSTRAINT [DF__criteria__min_sc__1B5E0D89] DEFAULT ((1)),
    [max_score] int NOT NULL CONSTRAINT [DF__criteria__max_sc__1C5231C2] DEFAULT ((5))
  , CONSTRAINT [PK__criteria__3213E83F3A00C61F] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__criteria__sort_o__3B75D760] CHECK ([sort_order]>=(0))
  , CONSTRAINT [CK__criteria__weight__3C69FB99] CHECK ([weight]<=(100) AND [weight]>=(1))
);
GO
CREATE TABLE [dbo].[disputes] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [filed_at] datetime2(6) NOT NULL,
    [filed_by] uniqueidentifier NOT NULL,
    [reason] varchar(2000) NOT NULL,
    [resolution] varchar(2000) NULL,
    [resolved_at] datetime2(6) NULL,
    [resolved_by] uniqueidentifier NULL,
    [round_id] uniqueidentifier NOT NULL,
    [status] varchar(255) NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__disputes__3213E83FE278D536] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__disputes__status__3F466844] CHECK ([status]='REJECTED' OR [status]='RESOLVED' OR [status]='UNDER_REVIEW' OR [status]='PENDING')
);
GO
CREATE TABLE [dbo].[email_otp_tokens] (
    [id] uniqueidentifier NOT NULL,
    [user_id] uniqueidentifier NOT NULL,
    [code] nvarchar(64) NOT NULL,
    [expires_at] datetime2(6) NOT NULL,
    [resend_allowed_at] datetime2(6) NOT NULL,
    [used] bit NOT NULL CONSTRAINT [DF__email_otp___used__5A4F643B] DEFAULT ((0)),
    [created_at] datetime2(6) NOT NULL,
    [updated_at] datetime2(6) NULL,
    [created_by] nvarchar(255) NULL,
    [updated_by] nvarchar(255) NULL
  , CONSTRAINT [PK__email_ot__3213E83FB7A527A9] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[event_enrollments] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [enrolled_at] datetime2(6) NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [status] varchar(255) NOT NULL,
    [user_id] uniqueidentifier NOT NULL,
    [preferred_role] nvarchar(100) NULL,
    [is_looking_for_team] bit NOT NULL CONSTRAINT [DF_event_enrollments_is_looking_for_team] DEFAULT ((0)),
    [is_profile_public] bit NOT NULL CONSTRAINT [DF_event_enrollments_is_profile_public] DEFAULT ((0))
  , CONSTRAINT [PK__event_en__3213E83F94533825] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKm5gqvxpwm3qgu2i13hnyqmnaq] UNIQUE NONCLUSTERED ([user_id], [event_id])
  , CONSTRAINT [CK__event_enr__statu__29221CFB] CHECK ([status]='WITHDRAWN' OR [status]='REJECTED' OR [status]='APPROVED' OR [status]='PENDING')
);
GO
CREATE TABLE [dbo].[event_judge_assignments] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [assigned_at] datetime2(6) NOT NULL,
    [judge_user_id] uniqueidentifier NOT NULL,
    [event_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__event_ju__3213E83FC80F4A32] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKtpnsnmfx3bigqf1cy0xfgjmni] UNIQUE NONCLUSTERED ([event_id], [judge_user_id])
);
GO
CREATE TABLE [dbo].[event_magic_tokens] (
    [id] uniqueidentifier NOT NULL,
    [user_id] uniqueidentifier NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [token] nvarchar(64) NOT NULL,
    [expires_at] datetime2(6) NOT NULL,
    [used] bit NOT NULL CONSTRAINT [DF__event_magi__used__4460231C] DEFAULT ((0)),
    [created_at] datetime2(6) NOT NULL,
    [updated_at] datetime2(6) NULL,
    [created_by] nvarchar(255) NULL,
    [updated_by] nvarchar(255) NULL
  , CONSTRAINT [PK__event_ma__3213E83FEA436EC8] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UQ__event_ma__CA90DA7A335205E5] UNIQUE NONCLUSTERED ([token])
);
GO
CREATE TABLE [dbo].[event_mentor_assignments] (
    [id] uniqueidentifier NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [mentor_user_id] uniqueidentifier NOT NULL,
    [assigned_at] datetime2(7) NOT NULL,
    [created_at] datetime2(7) NOT NULL,
    [updated_at] datetime2(7) NULL,
    [created_by] nvarchar(255) NULL,
    [updated_by] nvarchar(255) NULL
  , CONSTRAINT [PK__event_me__3213E83F1A773C06] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_event_mentor] UNIQUE NONCLUSTERED ([event_id], [mentor_user_id])
);
GO
CREATE TABLE [dbo].[event_publication] (
    [id] uniqueidentifier NOT NULL,
    [completion_date] datetimeoffset(6) NULL,
    [event_type] nvarchar(512) NOT NULL,
    [listener_id] nvarchar(512) NOT NULL,
    [publication_date] datetimeoffset(6) NULL,
    [serialized_event] nvarchar(MAX) NOT NULL
  , CONSTRAINT [PK__event_pu__3213E83F5F6C1CA5] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[event_schedules] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__event_schedu__id__038683F8] DEFAULT (newid()),
    [event_id] uniqueidentifier NOT NULL,
    [type] nvarchar(30) NOT NULL,
    [title] nvarchar(255) NOT NULL,
    [description] nvarchar(1000) NULL,
    [start_time] datetime2(7) NOT NULL,
    [end_time] datetime2(7) NOT NULL,
    [gate] nvarchar(30) NULL,
    [sort_order] int NOT NULL CONSTRAINT [DF__event_sch__sort___047AA831] DEFAULT ((0)),
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__event_sch__creat__056ECC6A] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__event_sch__updat__0662F0A3] DEFAULT (getutcdate()),
    [created_by] varchar(255) NULL,
    [updated_by] varchar(255) NULL
  , CONSTRAINT [PK__event_sc__3213E83FCA42D576] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[event_tiebreaker_criteria] (
    [event_id] uniqueidentifier NOT NULL,
    [template_criterion_id] uniqueidentifier NOT NULL,
    [sort_order] int NOT NULL
  , CONSTRAINT [PK__event_ti__97122388AF81E697] PRIMARY KEY CLUSTERED ([event_id], [sort_order])
);
GO
CREATE TABLE [dbo].[finalist_contested_slot_teams] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__finalist_con__id__1881A0DE] DEFAULT (newid()),
    [contested_slot_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [final_score] decimal(7,4) NULL,
    [submitted_at] datetime2(7) NULL,
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__finalist___creat__1975C517] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__finalist___updat__1A69E950] DEFAULT (getutcdate()),
    [created_by] varchar(255) NULL,
    [updated_by] varchar(255) NULL
  , CONSTRAINT [PK__finalist__3213E83F1CEB8067] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_contested_slot_team] UNIQUE NONCLUSTERED ([contested_slot_id], [team_id])
  , CONSTRAINT [UKgd614s3awdkw2r75iikqkan0r] UNIQUE NONCLUSTERED ([contested_slot_id], [team_id])
);
GO
CREATE TABLE [dbo].[finalist_contested_slots] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__finalist_con__id__10E07F16] DEFAULT (newid()),
    [event_id] uniqueidentifier NOT NULL,
    [track_id] uniqueidentifier NULL,
    [slot_type] varchar(255) NULL,
    [slot_index] int NOT NULL,
    [needs_penalty_evaluation] bit NOT NULL CONSTRAINT [DF__finalist___needs__11D4A34F] DEFAULT ((1)),
    [resolved] bit NOT NULL CONSTRAINT [DF__finalist___resol__12C8C788] DEFAULT ((0)),
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__finalist___creat__13BCEBC1] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__finalist___updat__14B10FFA] DEFAULT (getutcdate()),
    [created_by] varchar(255) NULL,
    [updated_by] varchar(255) NULL
  , CONSTRAINT [PK__finalist__3213E83FCCA4B4E3] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[finalist_selections] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__finalist_sel__id__69C6B1F5] DEFAULT (newid()),
    [event_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [track_id] uniqueidentifier NULL,
    [preliminary_rank] int NOT NULL,
    [selected_reason] nvarchar(500) NULL,
    [selected_at] datetime2(7) NOT NULL,
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__finalist___creat__6ABAD62E] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__finalist___updat__6BAEFA67] DEFAULT (getutcdate()),
    [created_by] nvarchar(255) NULL,
    [updated_by] nvarchar(255) NULL,
    [selection_method] varchar(255) NULL,
    [needs_penalty_evaluation] bit NOT NULL CONSTRAINT [DF__finalist___needs__0E04126B] DEFAULT ((0)),
    [eligible] bit NOT NULL CONSTRAINT [DF__finalist___eligi__4AD81681] DEFAULT ((1))
  , CONSTRAINT [PK__finalist__3213E83FD8BFE17C] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_finalist_event_team] UNIQUE NONCLUSTERED ([event_id], [team_id])
  , CONSTRAINT [UK4b484bu8jyfdkjnl1w04w4ia9] UNIQUE NONCLUSTERED ([event_id], [team_id])
);
GO
CREATE TABLE [dbo].[hackathon_events] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [end_date] date NOT NULL,
    [name] varchar(255) NOT NULL,
    [registration_deadline] date NOT NULL,
    [season] varchar(50) NOT NULL,
    [start_date] date NOT NULL,
    [status] varchar(255) NOT NULL,
    [year] int NOT NULL,
    [description] nvarchar(2000) NULL,
    [format] varchar(50) NULL,
    [location] varchar(500) NULL,
    [max_team] int NULL,
    [min_team] int NULL,
    [registration_open_date] date NULL,
    [scoring_template_id] uniqueidentifier NULL,
    [semester_max] int NULL,
    [semester_min] int NULL,
    [tiebreaker_criteria] varchar(1000) NULL,
    [leaderboard_public] bit NOT NULL CONSTRAINT [DF_events_leaderboard_public] DEFAULT ((0)),
    [competition_format] nvarchar(50) NOT NULL CONSTRAINT [DF__hackathon__compe__65F62111] DEFAULT ('GENERIC'),
    [avatar_url] nvarchar(500) NULL
  , CONSTRAINT [PK__hackatho__3213E83F2C8373FD] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKg1t6o5chi9anma0jefjohyb24] UNIQUE NONCLUSTERED ([name])
  , CONSTRAINT [CK__hackathon__max_t__2A164134] CHECK ([max_team]>=(0))
  , CONSTRAINT [CK__hackathon__min_t__2B0A656D] CHECK ([min_team]>=(0))
);
GO
CREATE TABLE [dbo].[honored_guests] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [full_name] varchar(255) NOT NULL,
    [title] varchar(255) NULL,
    [event_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__honored___3213E83F2E9F2C96] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[invitations] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [expires_at] datetime2(6) NULL,
    [invitee_email] varchar(255) NOT NULL,
    [inviter_id] uniqueidentifier NOT NULL,
    [status] varchar(255) NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__invitati__3213E83FAA5EDE85] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK_invitations_status] CHECK ([status]='CANCELLED' OR [status]='EXPIRED' OR [status]='REJECTED' OR [status]='ACCEPTED' OR [status]='PENDING')
);
GO
CREATE TABLE [dbo].[judge_assignments] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [assigned_at] datetime2(6) NOT NULL,
    [judge_user_id] uniqueidentifier NOT NULL,
    [round_id] uniqueidentifier NOT NULL,
    [track_id] uniqueidentifier NULL,
    [group_id] uniqueidentifier NULL,
    [deactivated_at] datetime2(7) NULL,
    [deactivation_reason] nvarchar(500) NULL,
    [scope] nvarchar(20) NOT NULL,
    [active] bit NOT NULL CONSTRAINT [df_judge_assignments_active] DEFAULT ((1)),
    [scope_track_key] AS (coalesce([track_id],CONVERT([uniqueidentifier],'00000000-0000-0000-0000-000000000000'))),
    [scope_group_key] AS (coalesce([group_id],CONVERT([uniqueidentifier],'00000000-0000-0000-0000-000000000000')))
  , CONSTRAINT [PK__judge_as__3213E83F6CB84488] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[judge_comments] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [comment] varchar(2000) NOT NULL,
    [criteria_id] uniqueidentifier NOT NULL,
    [judge_score_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__judge_co__3213E83FA5BCC5FF] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UK9upkkijmrrd4l8o8cd7i52tv6] UNIQUE NONCLUSTERED ([judge_score_id], [criteria_id])
);
GO
CREATE TABLE [dbo].[judge_score_details] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [criteria_id] uniqueidentifier NOT NULL,
    [score] int NOT NULL,
    [judge_score_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__judge_sc__3213E83F60660428] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKfkg47gtbko05ng9bl3ojbkbyc] UNIQUE NONCLUSTERED ([judge_score_id], [criteria_id])
  , CONSTRAINT [CK__judge_sco__score__4D94879B] CHECK ([score]<=(100) AND [score]>=(0))
);
GO
CREATE TABLE [dbo].[judge_scores] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [completed_at] datetime2(6) NULL,
    [judge_user_id] uniqueidentifier NOT NULL,
    [round_id] uniqueidentifier NOT NULL,
    [started_at] datetime2(6) NOT NULL,
    [status] varchar(255) NOT NULL,
    [submission_id] uniqueidentifier NOT NULL,
    [version] bigint NOT NULL CONSTRAINT [DF__judge_sco__versi__73852659] DEFAULT ((0))
  , CONSTRAINT [PK__judge_sc__3213E83F521247F1] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKsprmswvcm6njn9fxwqfl2sunu] UNIQUE NONCLUSTERED ([judge_user_id], [submission_id])
  , CONSTRAINT [CK__judge_sco__statu__5070F446] CHECK ([status]='LOCKED' OR [status]='COMPLETED' OR [status]='IN_PROGRESS')
);
GO
CREATE TABLE [dbo].[mentor_assignments] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [assigned_at] datetime2(6) NOT NULL,
    [mentor_user_id] uniqueidentifier NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [track_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__mentor_a__3213E83F7B3D9E14] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UQ_mentor_event_track_mentor] UNIQUE NONCLUSTERED ([event_id], [track_id], [mentor_user_id])
);
GO
CREATE TABLE [dbo].[mentor_chat_messages] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [message] varchar(2000) NOT NULL,
    [sender_user_id] uniqueidentifier NOT NULL,
    [sent_at] datetime2(6) NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__mentor_c__3213E83F57CA46B4] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[mentor_feedbacks] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [content] varchar(5000) NOT NULL,
    [mentor_user_id] uniqueidentifier NOT NULL,
    [subject] varchar(255) NOT NULL,
    [submitted_at] datetime2(6) NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__mentor_f__3213E83F7B8BE1BE] PRIMARY KEY CLUSTERED ([id])
);
GO
CREATE TABLE [dbo].[mentor_invitations] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [inviter_id] uniqueidentifier NOT NULL,
    [mentor_user_id] uniqueidentifier NOT NULL,
    [message] varchar(500) NULL,
    [status] varchar(255) NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__mentor_i__3213E83FF184D872] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__mentor_in__statu__51300E55] CHECK ([status]='DENIED' OR [status]='ACCEPTED' OR [status]='PENDING')
);
GO
CREATE TABLE [dbo].[mentor_teams] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [assigned_at] datetime2(6) NOT NULL,
    [mentor_user_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__mentor_t__3213E83FC2265DE3] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKne91mupelxy705mjb3g32nupv] UNIQUE NONCLUSTERED ([mentor_user_id], [team_id])
);
GO
CREATE TABLE [dbo].[notification_recipients] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [channel] varchar(255) NOT NULL,
    [read_at] datetime2(6) NULL,
    [sent_at] datetime2(6) NULL,
    [user_id] uniqueidentifier NOT NULL,
    [notification_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__notifica__3213E83FA6F7B831] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__notificat__chann__571DF1D5] CHECK ([channel]='IN_APP' OR [channel]='EMAIL')
);
GO
CREATE TABLE [dbo].[notifications] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [message] varchar(2000) NOT NULL,
    [reference_id] uniqueidentifier NULL,
    [reference_type] varchar(100) NULL,
    [title] varchar(255) NOT NULL,
    [type] varchar(255) NOT NULL
  , CONSTRAINT [PK__notifica__3213E83F526C90AC] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK_notifications_type] CHECK ([type]=N'TEAM_PROGRESS_ALERT' OR [type]=N'MEMBER_KICKED' OR [type]=N'INVITATION_ACCEPTED' OR [type]=N'LEAVE_REQUEST_REJECTED' OR [type]=N'LEAVE_REQUEST_APPROVED' OR [type]=N'LEAVE_REQUEST_CREATED' OR [type]=N'JOIN_REQUEST_REJECTED' OR [type]=N'JOIN_REQUEST_ACCEPTED' OR [type]=N'JOIN_REQUEST_RECEIVED' OR [type]=N'DISPUTE_FILED' OR [type]=N'RESULTS_PUBLISHED' OR [type]=N'SCORING_REOPENED' OR [type]=N'SCORE_ADJUSTMENT_APPROVED' OR [type]=N'MENTOR_ASSIGNED' OR [type]=N'JUDGE_ASSIGNMENT_REMOVED' OR [type]=N'JUDGE_ASSIGNMENT_CHANGED' OR [type]=N'JUDGE_ASSIGNED' OR [type]=N'SUBMISSION_CREATED' OR [type]=N'MENTOR_TEAM_ASSIGNED' OR [type]=N'INVITATION_RECEIVED' OR [type]=N'TEAM_CONFIRMED' OR [type]=N'TEAM_REGISTERED' OR [type]=N'INTERNAL_ACCOUNT_CREATED' OR [type]=N'ACCOUNT_REJECTED' OR [type]=N'ACCOUNT_APPROVED')
);
GO
CREATE TABLE [dbo].[participant_feedbacks] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [comment] varchar(2000) NULL,
    [event_id] uniqueidentifier NOT NULL,
    [overall_rating] int NOT NULL,
    [submitted_at] datetime2(6) NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [user_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__particip__3213E83F09C5B457] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKfrdi5g034tpd8s50eincvj53l] UNIQUE NONCLUSTERED ([user_id], [event_id])
  , CONSTRAINT [CK__participa__overa__25DB9BFC] CHECK ([overall_rating]<=(5) AND [overall_rating]>=(1))
);
GO
CREATE TABLE [dbo].[participation_certificates] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [event_id] uniqueidentifier NOT NULL,
    [issued_at] datetime2(6) NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [user_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__particip__3213E83FF7951E27] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UK9hu242kt88oarnwncca3m1jpl] UNIQUE NONCLUSTERED ([event_id], [user_id])
);
GO
CREATE TABLE [dbo].[password_reset_tokens] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [expires_at] datetime2(6) NOT NULL,
    [token] nvarchar(64) NOT NULL,
    [used] bit NOT NULL,
    [user_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__password__3213E83FDF6540FB] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UK71lqwbwtklmljk3qlsugr1mig] UNIQUE NONCLUSTERED ([token])
);
GO
CREATE TABLE [dbo].[prizes] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [quantity] int NOT NULL,
    [rank] varchar(255) NOT NULL,
    [track_id] uniqueidentifier NULL,
    [value] nvarchar(2000) NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [label] nvarchar(100) NULL
  , CONSTRAINT [PK__prizes__3213E83F2E3AF2D2] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__prizes__quantity__31B762FC] CHECK ([quantity]>=(1))
  , CONSTRAINT [CK__prizes__rank__32AB8735] CHECK ([rank]='CONSOLATION' OR [rank]='THIRD' OR [rank]='SECOND' OR [rank]='FIRST')
);
GO
CREATE TABLE [dbo].[published_results] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [dispute_deadline] datetime2(6) NOT NULL,
    [published_at] datetime2(6) NOT NULL,
    [published_by] uniqueidentifier NOT NULL,
    [round_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__publishe__3213E83FAE0B1D30] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKnq9dain9b04ydooyw47290ygc] UNIQUE NONCLUSTERED ([round_id])
);
GO
CREATE TABLE [dbo].[rankings] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [calculated_at] datetime2(6) NOT NULL,
    [final_score] numeric(7,4) NOT NULL,
    [rank] int NOT NULL,
    [round_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [version] int NOT NULL
  , CONSTRAINT [PK__rankings__3213E83F547CF8EA] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKonwt9r5jergouw53hceywgka6] UNIQUE NONCLUSTERED ([team_id], [round_id], [version])
  , CONSTRAINT [CK__rankings__rank__60A75C0F] CHECK ([rank]>=(1))
  , CONSTRAINT [CK__rankings__versio__619B8048] CHECK ([version]>=(1))
);
GO
CREATE TABLE [dbo].[refresh_tokens] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [expires_at] datetime2(6) NOT NULL,
    [revoked] bit NOT NULL,
    [token] nvarchar(64) NOT NULL,
    [user_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__refresh___3213E83FB8514000] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKghpmfn23vmxfu3spu3lfg4r2d] UNIQUE NONCLUSTERED ([token])
);
GO
CREATE TABLE [dbo].[rounds] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [advancement_cutoff] int NOT NULL,
    [end_date] datetime2(6) NOT NULL,
    [name] nvarchar(255) NOT NULL,
    [round_number] int NOT NULL,
    [scoring_deadline] datetime2(6) NOT NULL,
    [start_date] datetime2(6) NOT NULL,
    [submission_deadline] datetime2(6) NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [round_weight] int NOT NULL CONSTRAINT [DF_rounds_round_weight] DEFAULT ((100)),
    [round_type] varchar(255) NULL,
    [slide_deadline] datetime2(7) NULL,
    [advancement_rule] varchar(255) NULL,
    [min_judges_per_round] int NOT NULL CONSTRAINT [df_rounds_min_judges] DEFAULT ((2))
  , CONSTRAINT [PK__rounds__3213E83F5D899841] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKnaw254kum6y7h9n0pg8j9xbm3] UNIQUE NONCLUSTERED ([event_id], [round_number])
  , CONSTRAINT [CK__rounds__advancem__66603565] CHECK ([advancement_cutoff]>=(1))
  , CONSTRAINT [CK__rounds__round_nu__6754599E] CHECK ([round_number]>=(1))
);
GO
CREATE TABLE [dbo].[score_review_requests] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [deviation_value] numeric(6,2) NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [max_judge_score] numeric(6,2) NOT NULL,
    [min_judge_score] numeric(6,2) NOT NULL,
    [resolution_note] varchar(2000) NULL,
    [resolved_at] datetime2(6) NULL,
    [resolved_by] uniqueidentifier NULL,
    [round_id] uniqueidentifier NOT NULL,
    [status] varchar(255) NOT NULL,
    [submission_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [adjustment_type] nvarchar(32) NULL,
    [requested_by] uniqueidentifier NULL,
    [request_note] nvarchar(2000) NULL,
    [approved_at] datetime2(7) NULL,
    [approved_by] uniqueidentifier NULL
  , CONSTRAINT [PK__score_re__3213E83FB7BACD69] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UK355jwgrl4fnja66u0avfuapfc] UNIQUE NONCLUSTERED ([submission_id])
  , CONSTRAINT [CK_score_review_requests_status] CHECK ([status]=N'IGNORED' OR [status]=N'RESOLVED' OR [status]=N'REJECTED' OR [status]=N'ADJUSTED' OR [status]=N'APPROVED' OR [status]=N'OPEN')
);
GO
CREATE TABLE [dbo].[scoring_template_criteria] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [description] varchar(1000) NULL,
    [name] varchar(255) NOT NULL,
    [sort_order] int NOT NULL,
    [weight] int NOT NULL,
    [scoring_template_id] uniqueidentifier NOT NULL,
    [min_score] int NOT NULL CONSTRAINT [DF__scoring_t__min_s__1D4655FB] DEFAULT ((1)),
    [max_score] int NOT NULL CONSTRAINT [DF__scoring_t__max_s__1E3A7A34] DEFAULT ((5))
  , CONSTRAINT [PK__scoring___3213E83FC7B9D966] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__scoring_t__sort___3587F3E0] CHECK ([sort_order]>=(0))
  , CONSTRAINT [CK__scoring_t__weigh__367C1819] CHECK ([weight]<=(100) AND [weight]>=(1))
);
GO
CREATE TABLE [dbo].[scoring_templates] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [description] varchar(1000) NULL,
    [name] varchar(255) NOT NULL
  , CONSTRAINT [PK__scoring___3213E83FC78731B9] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKiuba4qcryl7vky426lsp5ufhu] UNIQUE NONCLUSTERED ([name])
);
GO
CREATE TABLE [dbo].[submission_attachments] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [file_name] varchar(255) NOT NULL,
    [file_size] bigint NOT NULL,
    [file_url] varchar(500) NOT NULL,
    [page_count] int NOT NULL,
    [submission_version_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__submissi__3213E83FFB332C8C] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__submissio__file___6A30C649] CHECK ([file_size]<=(5242880) AND [file_size]>=(1))
  , CONSTRAINT [CK__submissio__page___6B24EA82] CHECK ([page_count]<=(2) AND [page_count]>=(1))
);
GO
CREATE TABLE [dbo].[submission_versions] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [demo_url] nvarchar(500) NULL,
    [github_url] nvarchar(500) NULL,
    [submitted_at] datetime2(6) NOT NULL,
    [version_number] int NOT NULL,
    [submission_id] uniqueidentifier NOT NULL,
    [slide_url] nvarchar(500) NULL
  , CONSTRAINT [PK__submissi__3213E83F81C0078B] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__submissio__versi__6E01572D] CHECK ([version_number]>=(1))
);
GO
CREATE TABLE [dbo].[submissions] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [current_version_id] uniqueidentifier NULL,
    [round_id] uniqueidentifier NOT NULL,
    [status] varchar(255) NOT NULL,
    [submitted_by] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__submissi__3213E83F8C90898B] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKt03gnaecu4hpou960189yu1xd] UNIQUE NONCLUSTERED ([team_id], [round_id])
  , CONSTRAINT [CK__submissio__statu__70DDC3D8] CHECK ([status]='NOT_SCORED' OR [status]='SCORED' OR [status]='SUBMITTED' OR [status]='DRAFT')
);
GO
CREATE TABLE [dbo].[sysdiagrams] (
    [name] sysname NOT NULL,
    [principal_id] int NOT NULL,
    [diagram_id] int IDENTITY(1,1) NOT NULL,
    [version] int NULL,
    [definition] varbinary(MAX) NULL
  , CONSTRAINT [PK__sysdiagr__C2B05B619C45FC51] PRIMARY KEY CLUSTERED ([diagram_id])
  , CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id], [name])
);
GO
CREATE TABLE [dbo].[system_config] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [default_rules] varchar(4000) NULL,
    [max_team_members] int NOT NULL,
    [min_team_members] int NOT NULL,
    [max_teams] int NULL,
    [min_teams] int NULL,
    [semester_min] int NULL,
    [semester_max] int NULL
  , CONSTRAINT [PK__system_c__3213E83F5B4438B6] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__system_co__max_t__19AACF41] CHECK ([max_teams]>=(0))
  , CONSTRAINT [CK__system_co__min_t__1A9EF37A] CHECK ([min_teams]>=(0))
  , CONSTRAINT [CK__system_co__max_t__3B40CD36] CHECK ([max_team_members]>=(1))
  , CONSTRAINT [CK__system_co__min_t__3C34F16F] CHECK ([min_team_members]>=(1))
);
GO
CREATE TABLE [dbo].[team_awards] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__team_awards__id__6F7F8B4B] DEFAULT (newid()),
    [event_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [prize_id] uniqueidentifier NOT NULL,
    [awarded_at] datetime2(7) NOT NULL,
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__team_awar__creat__7073AF84] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__team_awar__updat__7167D3BD] DEFAULT (getutcdate()),
    [created_by] nvarchar(255) NULL,
    [updated_by] nvarchar(255) NULL
  , CONSTRAINT [PK__team_awa__3213E83FB6025A77] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_team_award_event_team] UNIQUE NONCLUSTERED ([event_id], [team_id])
  , CONSTRAINT [UKpjyb6tp2bup52n3kdss4mg94a] UNIQUE NONCLUSTERED ([event_id], [team_id])
);
GO
CREATE TABLE [dbo].[team_join_requests] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [event_id] uniqueidentifier NOT NULL,
    [message] varchar(500) NULL,
    [requester_id] uniqueidentifier NOT NULL,
    [resolved_at] datetime2(6) NULL,
    [status] varchar(255) NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__team_joi__3213E83F8A940445] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__team_join__statu__41B8C09B] CHECK ([status]='CANCELLED' OR [status]='REJECTED' OR [status]='ACCEPTED' OR [status]='PENDING')
);
GO
CREATE TABLE [dbo].[team_judge_assignments] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [assigned_at] datetime2(6) NOT NULL,
    [judge_user_id] uniqueidentifier NOT NULL,
    [round_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__team_jud__3213E83FC454AC77] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UK4qigww0idqy7mrw20ugchas4k] UNIQUE NONCLUSTERED ([team_id], [round_id], [judge_user_id])
);
GO
CREATE TABLE [dbo].[team_leave_requests] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [event_id] uniqueidentifier NOT NULL,
    [reason] varchar(500) NULL,
    [resolved_at] datetime2(6) NULL,
    [resolved_by] uniqueidentifier NULL,
    [status] varchar(255) NOT NULL,
    [user_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__team_lea__3213E83F6CBF2E1D] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [CK__team_leav__statu__44952D46] CHECK ([status]='REJECTED' OR [status]='APPROVED' OR [status]='PENDING')
);
GO
CREATE TABLE [dbo].[team_members] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [joined_at] datetime2(6) NOT NULL,
    [role] varchar(255) NOT NULL,
    [user_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [event_id] uniqueidentifier NOT NULL
  , CONSTRAINT [PK__team_mem__3213E83F07908A65] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKs8nuwsa7nvebc246ed822w68x] UNIQUE NONCLUSTERED ([team_id], [user_id])
  , CONSTRAINT [uq_team_member_event_user] UNIQUE NONCLUSTERED ([event_id], [user_id])
  , CONSTRAINT [CK__team_membe__role__73BA3083] CHECK ([role]='MEMBER' OR [role]='LEADER')
);
GO
CREATE TABLE [dbo].[team_needed_roles] (
    [team_id] uniqueidentifier NOT NULL,
    [role] varchar(30) NOT NULL
  , CONSTRAINT [CK__team_neede__role__2C88998B] CHECK ([role]='OTHER' OR [role]='PM' OR [role]='DATA' OR [role]='DEVOPS' OR [role]='DESIGN' OR [role]='AI_ML' OR [role]='MOBILE' OR [role]='FULLSTACK' OR [role]='BACKEND' OR [role]='FRONTEND')
);
GO
CREATE TABLE [dbo].[team_progress_alerts] (
    [id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [round_id] uniqueidentifier NOT NULL,
    [risk_level] nvarchar(20) NOT NULL,
    [reasons] nvarchar(500) NULL,
    [last_alerted_at] datetime2(7) NULL,
    [created_at] datetime2(7) NOT NULL,
    [updated_at] datetime2(7) NULL,
    [created_by] nvarchar(255) NULL,
    [updated_by] nvarchar(255) NULL
  , CONSTRAINT [PK__team_pro__3213E83F64595AAA] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_team_progress_alert_team_round] UNIQUE NONCLUSTERED ([team_id], [round_id])
);
GO
CREATE TABLE [dbo].[teams] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [event_id] uniqueidentifier NOT NULL,
    [leader_id] uniqueidentifier NOT NULL,
    [name] varchar(255) NOT NULL,
    [status] varchar(255) NOT NULL,
    [track_id] uniqueidentifier NULL,
    [track_assigned_at] datetime2(7) NULL,
    [track_assignment_method] varchar(255) NULL,
    [track_assigned_by] uniqueidentifier NULL,
    [recruitment_note] varchar(1000) NULL,
    [is_recruiting] bit NOT NULL CONSTRAINT [DF_teams_is_recruiting] DEFAULT ((0)),
    [group_id] uniqueidentifier NULL
  , CONSTRAINT [PK__teams__3213E83F00B5A01C] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UKh96ggvfjvw458isq93w50kmrf] UNIQUE NONCLUSTERED ([event_id], [name])
  , CONSTRAINT [CK__teams__status__76969D2E] CHECK ([status]='DISBANDED' OR [status]='CONFIRMED' OR [status]='FORMING')
);
GO
CREATE TABLE [dbo].[track_draw_queue] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__track_draw_q__id__7EC1CEDB] DEFAULT (newid()),
    [session_id] uniqueidentifier NOT NULL,
    [team_id] uniqueidentifier NOT NULL,
    [queue_order] int NOT NULL,
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__track_dra__creat__7FB5F314] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__track_dra__updat__00AA174D] DEFAULT (getutcdate()),
    [created_by] varchar(255) NULL,
    [updated_by] varchar(255) NULL
  , CONSTRAINT [PK__track_dr__3213E83F965A8570] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_draw_queue_session_order] UNIQUE NONCLUSTERED ([session_id], [queue_order])
  , CONSTRAINT [uq_draw_queue_session_team] UNIQUE NONCLUSTERED ([session_id], [team_id])
  , CONSTRAINT [UK69oqex9b0mg7xd0vtipantt9g] UNIQUE NONCLUSTERED ([session_id], [team_id])
  , CONSTRAINT [UKnyaq1hmm0mcrmqmeqa62alwqu] UNIQUE NONCLUSTERED ([session_id], [queue_order])
);
GO
CREATE TABLE [dbo].[track_draw_sessions] (
    [id] uniqueidentifier NOT NULL CONSTRAINT [DF__track_draw_s__id__762C88DA] DEFAULT (newid()),
    [event_id] uniqueidentifier NOT NULL,
    [status] nvarchar(20) NOT NULL CONSTRAINT [DF__track_dra__statu__7720AD13] DEFAULT ('OPEN'),
    [current_index] int NOT NULL CONSTRAINT [DF__track_dra__curre__7814D14C] DEFAULT ((0)),
    [scheduled_at] datetime2(7) NULL,
    [opened_at] datetime2(7) NULL,
    [opened_by] uniqueidentifier NULL,
    [created_at] datetime2(7) NOT NULL CONSTRAINT [DF__track_dra__creat__7908F585] DEFAULT (getutcdate()),
    [updated_at] datetime2(7) NOT NULL CONSTRAINT [DF__track_dra__updat__79FD19BE] DEFAULT (getutcdate()),
    [created_by] varchar(255) NULL,
    [updated_by] varchar(255) NULL
  , CONSTRAINT [PK__track_dr__3213E83F217F5B7A] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [uq_track_draw_session_event] UNIQUE NONCLUSTERED ([event_id])
  , CONSTRAINT [UKa9mj81t7o38nsry31cnr32vqc] UNIQUE NONCLUSTERED ([event_id])
);
GO
CREATE TABLE [dbo].[tracks] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [description] nvarchar(1000) NULL,
    [max_teams] int NOT NULL,
    [name] nvarchar(255) NOT NULL,
    [event_id] uniqueidentifier NOT NULL,
    [scoring_template_id] uniqueidentifier NULL,
    [topic] nvarchar(1000) NULL,
    [status] nvarchar(20) NOT NULL CONSTRAINT [DF__tracks__status__725BF7F6] DEFAULT ('OPEN')
  , CONSTRAINT [PK__tracks__3213E83F53E8B6BB] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UK_tracks_event_id_name] UNIQUE NONCLUSTERED ([event_id], [name])
  , CONSTRAINT [CK__tracks__max_team__40F9A68C] CHECK ([max_teams]>=(1))
);
GO
CREATE TABLE [dbo].[users] (
    [id] uniqueidentifier NOT NULL,
    [created_at] datetime2(6) NOT NULL,
    [created_by] varchar(255) NULL,
    [updated_at] datetime2(6) NULL,
    [updated_by] varchar(255) NULL,
    [email] varchar(255) NOT NULL,
    [failed_login_attempts] int NOT NULL,
    [full_name] nvarchar(255) NOT NULL,
    [locked_until] datetime2(6) NULL,
    [password_hash] varchar(255) NOT NULL,
    [phone] varchar(20) NULL,
    [status] varchar(255) NOT NULL,
    [student_id] varchar(20) NULL,
    [university_name] nvarchar(255) NULL,
    [user_type] varchar(255) NOT NULL,
    [semester] int NULL,
    [temporary_account] bit NOT NULL CONSTRAINT [DF_users_temporary_account] DEFAULT ((0)),
    [student_standing] nvarchar(20) NOT NULL CONSTRAINT [DF__users__student_s__075714DC] DEFAULT ('ENROLLED'),
    [avatar_url] nvarchar(500) NULL
  , CONSTRAINT [PK__users__3213E83FED74046D] PRIMARY KEY CLUSTERED ([id])
  , CONSTRAINT [UK6dotkott2kjsp8vw4d0m25fb7] UNIQUE NONCLUSTERED ([email])
  , CONSTRAINT [CK__users__status__797309D9] CHECK ([status]='LOCKED' OR [status]='REJECTED' OR [status]='ACTIVE' OR [status]='PENDING' OR [status]='DELETED')
  , CONSTRAINT [CK__users__user_type__7A672E12] CHECK ([user_type]='SYSTEM_ADMIN' OR [user_type]='EVENT_COORDINATOR' OR [user_type]='LECTURER' OR [user_type]='JUDGE' OR [user_type]='MENTOR' OR [user_type]='EXTERNAL_STUDENT' OR [user_type]='FPT_STUDENT')
);
GO
ALTER TABLE [dbo].[competition_groups] ADD CONSTRAINT [fk_competition_group_track] FOREIGN KEY ([track_id]) REFERENCES [dbo].[tracks] ([id]);
GO
ALTER TABLE [dbo].[criteria] ADD CONSTRAINT [FKgckr73ruv9cmt9fsrs8rinq89] FOREIGN KEY ([round_id]) REFERENCES [dbo].[rounds] ([id]);
GO
ALTER TABLE [dbo].[event_judge_assignments] ADD CONSTRAINT [FK1qa6pie6mkx1fsfyoelcls9l7] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
ALTER TABLE [dbo].[event_mentor_assignments] ADD CONSTRAINT [fk_event_mentor_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
ALTER TABLE [dbo].[event_tiebreaker_criteria] ADD CONSTRAINT [FK4nhv5qtdevs6t6e2tljvdxqkg] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
ALTER TABLE [dbo].[finalist_contested_slot_teams] ADD CONSTRAINT [FK8gq99k6kmpi3hku6biklmmwaw] FOREIGN KEY ([contested_slot_id]) REFERENCES [dbo].[finalist_contested_slots] ([id]);
GO
ALTER TABLE [dbo].[honored_guests] ADD CONSTRAINT [FKof6w4y8juto4k6v4okg8yg5q0] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
ALTER TABLE [dbo].[invitations] ADD CONSTRAINT [FK1m1usbedadl51q5ea4vic07nv] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams] ([id]);
GO
ALTER TABLE [dbo].[judge_assignments] ADD CONSTRAINT [FK1ledehgi4wp5gckvvump5crbk] FOREIGN KEY ([round_id]) REFERENCES [dbo].[rounds] ([id]);
GO
ALTER TABLE [dbo].[judge_comments] ADD CONSTRAINT [FK92q9gc0o128ujg9c523vpbrct] FOREIGN KEY ([judge_score_id]) REFERENCES [dbo].[judge_scores] ([id]);
GO
ALTER TABLE [dbo].[judge_score_details] ADD CONSTRAINT [FK8smnwny2yri31aa6shd6vtm0a] FOREIGN KEY ([judge_score_id]) REFERENCES [dbo].[judge_scores] ([id]);
GO
ALTER TABLE [dbo].[mentor_assignments] ADD CONSTRAINT [FKwvhwtx3enkjh6n1gec6a0r18] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
ALTER TABLE [dbo].[mentor_invitations] ADD CONSTRAINT [FK5nu42r4a5n8hto9rxajur32sw] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams] ([id]);
GO
ALTER TABLE [dbo].[mentor_teams] ADD CONSTRAINT [FKhoqsg2tjy070pa5gttrdr6x73] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams] ([id]);
GO
ALTER TABLE [dbo].[notification_recipients] ADD CONSTRAINT [FKiuf5qgbttjq6ry57u1dni7qn4] FOREIGN KEY ([notification_id]) REFERENCES [dbo].[notifications] ([id]);
GO
ALTER TABLE [dbo].[prizes] ADD CONSTRAINT [FKkwc00brn3mwjx3bla6de46n4x] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
ALTER TABLE [dbo].[rounds] ADD CONSTRAINT [FK7onks00osgiogw19xow6h4ctq] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
ALTER TABLE [dbo].[scoring_template_criteria] ADD CONSTRAINT [FK8uq54vjugmy6ugi7m8ux1yrga] FOREIGN KEY ([scoring_template_id]) REFERENCES [dbo].[scoring_templates] ([id]);
GO
ALTER TABLE [dbo].[submission_attachments] ADD CONSTRAINT [FK9omqfuipbku7sixjbofc90inn] FOREIGN KEY ([submission_version_id]) REFERENCES [dbo].[submission_versions] ([id]);
GO
ALTER TABLE [dbo].[submission_versions] ADD CONSTRAINT [FKncqv2j7ca8x8ox484lbcune5n] FOREIGN KEY ([submission_id]) REFERENCES [dbo].[submissions] ([id]);
GO
ALTER TABLE [dbo].[team_join_requests] ADD CONSTRAINT [FKm5ylappny6pgrgpwtafymhvxc] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams] ([id]);
GO
ALTER TABLE [dbo].[team_leave_requests] ADD CONSTRAINT [FKnwh1xk9fo0s7jf3v4cjqmsud0] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams] ([id]);
GO
ALTER TABLE [dbo].[team_members] ADD CONSTRAINT [FKtgca08el3ofisywcf11f0f76t] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams] ([id]);
GO
ALTER TABLE [dbo].[team_needed_roles] ADD CONSTRAINT [FKl8x36cdulwxc8kvot3vlef81y] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams] ([id]);
GO
ALTER TABLE [dbo].[track_draw_queue] ADD CONSTRAINT [FKeawpk0192yys2q1q00bxmwo21] FOREIGN KEY ([session_id]) REFERENCES [dbo].[track_draw_sessions] ([id]);
GO
ALTER TABLE [dbo].[tracks] ADD CONSTRAINT [FK3guhagqaylgj5w0c97d9sl34j] FOREIGN KEY ([event_id]) REFERENCES [dbo].[hackathon_events] ([id]);
GO
CREATE NONCLUSTERED INDEX [idx_allowed_domain_event] ON [dbo].[allowed_email_domains] ([event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_audit_actor_id] ON [dbo].[audit_logs] ([actor_id]);
GO
CREATE NONCLUSTERED INDEX [idx_audit_timestamp] ON [dbo].[audit_logs] ([timestamp]);
GO
CREATE NONCLUSTERED INDEX [IX_email_otp_tokens_user_code] ON [dbo].[email_otp_tokens] ([user_id], [code]);
GO
CREATE NONCLUSTERED INDEX [idx_enrollment_event_id] ON [dbo].[event_enrollments] ([event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_enrollment_user_id] ON [dbo].[event_enrollments] ([user_id]);
GO
CREATE NONCLUSTERED INDEX [IX_event_magic_tokens_user_event] ON [dbo].[event_magic_tokens] ([user_id], [event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_event_schedule_event] ON [dbo].[event_schedules] ([event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_contested_slot_teams_slot] ON [dbo].[finalist_contested_slot_teams] ([contested_slot_id]);
GO
CREATE NONCLUSTERED INDEX [idx_contested_slot_event] ON [dbo].[finalist_contested_slots] ([event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_finalist_event] ON [dbo].[finalist_selections] ([event_id]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [uq_judge_assignment_scope] ON [dbo].[judge_assignments] ([judge_user_id], [round_id], [scope_track_key], [scope_group_key]) WHERE ([active]=(1));
GO
CREATE NONCLUSTERED INDEX [idx_judge_score_judge_user_id] ON [dbo].[judge_scores] ([judge_user_id]);
GO
CREATE NONCLUSTERED INDEX [idx_judge_score_round_id] ON [dbo].[judge_scores] ([round_id]);
GO
CREATE NONCLUSTERED INDEX [idx_judge_score_submission_id] ON [dbo].[judge_scores] ([submission_id]);
GO
CREATE NONCLUSTERED INDEX [idx_notif_recipient_user_id] ON [dbo].[notification_recipients] ([user_id]);
GO
CREATE NONCLUSTERED INDEX [idx_participant_feedback_event_id] ON [dbo].[participant_feedbacks] ([event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_ranking_round_id] ON [dbo].[rankings] ([round_id]);
GO
CREATE NONCLUSTERED INDEX [idx_ranking_team_id] ON [dbo].[rankings] ([team_id]);
GO
CREATE NONCLUSTERED INDEX [idx_refresh_token_user_id] ON [dbo].[refresh_tokens] ([user_id]);
GO
CREATE NONCLUSTERED INDEX [idx_submission_round_id] ON [dbo].[submissions] ([round_id]);
GO
CREATE NONCLUSTERED INDEX [idx_submission_team_id] ON [dbo].[submissions] ([team_id]);
GO
CREATE NONCLUSTERED INDEX [idx_team_award_event] ON [dbo].[team_awards] ([event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_team_member_team_id] ON [dbo].[team_members] ([team_id]);
GO
CREATE NONCLUSTERED INDEX [idx_team_member_user_id] ON [dbo].[team_members] ([user_id]);
GO
CREATE NONCLUSTERED INDEX [idx_team_member_event_id] ON [dbo].[team_members] ([event_id]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [uq_team_members_one_leader] ON [dbo].[team_members] ([team_id]) WHERE ([role]='LEADER');
GO
CREATE UNIQUE NONCLUSTERED INDEX [uq_team_join_pending] ON [dbo].[team_join_requests] ([team_id], [requester_id]) WHERE ([status]='PENDING');
GO
CREATE UNIQUE NONCLUSTERED INDEX [uq_team_leave_pending] ON [dbo].[team_leave_requests] ([team_id], [user_id]) WHERE ([status]='PENDING');
GO
CREATE UNIQUE NONCLUSTERED INDEX [uq_invitation_pending] ON [dbo].[invitations] ([team_id], [invitee_email]) WHERE ([status]='PENDING');
GO
CREATE UNIQUE NONCLUSTERED INDEX [uq_allowed_domain_platform] ON [dbo].[allowed_email_domains] ([domain]) WHERE ([event_id] IS NULL);
GO
CREATE NONCLUSTERED INDEX [idx_team_event_id] ON [dbo].[teams] ([event_id]);
GO
CREATE NONCLUSTERED INDEX [idx_draw_queue_session] ON [dbo].[track_draw_queue] ([session_id]);
GO
