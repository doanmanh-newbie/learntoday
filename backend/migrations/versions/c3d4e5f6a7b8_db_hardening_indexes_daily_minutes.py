"""db hardening: indexes, unique folder_words, meaning_en, daily study minutes

Revision ID: c3d4e5f6a7b8
Revises: d65263a1aef2
Create Date: 2026-10-14 10:00:00

- folder_words: chặn trùng (folder_id, word_id) + index theo folder (trước đây mọi truy vấn
  "danh sách từ trong folder" đều quét toàn bảng, và có thể chèn trùng từ vào cùng folder).
- words.meaning_en: giữ định nghĩa tiếng Anh gốc, cột meaning dành cho nghĩa tiếng Việt.
- users.study_minutes_today / study_minutes_date: phút học THEO NGÀY (STT 12).
- index cho các bảng hay lọc theo user.
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'd65263a1aef2'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('study_minutes_today', sa.Integer(), server_default='0', nullable=True))
        batch_op.add_column(sa.Column('study_minutes_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('last_reminder_date', sa.Date(), nullable=True))

    with op.batch_alter_table('words', schema=None) as batch_op:
        batch_op.add_column(sa.Column('meaning_en', sa.Text(), nullable=True))
        batch_op.create_index('idx_words_word', ['word'], unique=False)
        batch_op.create_index('idx_words_category', ['category'], unique=False)

    # Xóa bản ghi trùng (nếu có) trước khi thêm ràng buộc UNIQUE - giữ lại 1 bản ghi
    op.execute(
        "DELETE FROM folder_words WHERE id IN ("
        " SELECT id FROM ("
        "  SELECT id, ROW_NUMBER() OVER (PARTITION BY folder_id, word_id ORDER BY id) AS rn FROM folder_words"
        " ) t WHERE t.rn > 1)"
    )
    with op.batch_alter_table('folder_words', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_folder_word', ['folder_id', 'word_id'])
        batch_op.create_index('idx_folder_words_folder_order', ['folder_id', 'order_index'], unique=False)
        batch_op.create_index('idx_folder_words_word', ['word_id'], unique=False)

    with op.batch_alter_table('folders', schema=None) as batch_op:
        batch_op.create_index('idx_folders_type_user', ['type', 'user_id'], unique=False)

    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.create_index('idx_refresh_tokens_user', ['user_id'], unique=False)

    with op.batch_alter_table('search_history', schema=None) as batch_op:
        batch_op.create_index('idx_search_history_user_created', ['user_id', 'created_at'], unique=False)


def downgrade():
    with op.batch_alter_table('search_history', schema=None) as batch_op:
        batch_op.drop_index('idx_search_history_user_created')
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.drop_index('idx_refresh_tokens_user')
    with op.batch_alter_table('folders', schema=None) as batch_op:
        batch_op.drop_index('idx_folders_type_user')
    with op.batch_alter_table('folder_words', schema=None) as batch_op:
        batch_op.drop_index('idx_folder_words_word')
        batch_op.drop_index('idx_folder_words_folder_order')
        batch_op.drop_constraint('uq_folder_word', type_='unique')
    with op.batch_alter_table('words', schema=None) as batch_op:
        batch_op.drop_index('idx_words_category')
        batch_op.drop_index('idx_words_word')
        batch_op.drop_column('meaning_en')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('last_reminder_date')
        batch_op.drop_column('study_minutes_date')
        batch_op.drop_column('study_minutes_today')
