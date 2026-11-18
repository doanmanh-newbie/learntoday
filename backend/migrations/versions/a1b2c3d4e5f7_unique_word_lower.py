"""words: chặn trùng từ (không phân biệt hoa thường, bỏ qua từ đã xoá mềm)

Revision ID: a1b2c3d4e5f7
Revises: b8c9d0e1f2a3
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f7'
down_revision = 'b8c9d0e1f2a3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index('uq_words_word_lower', 'words', [sa.text('lower(word)')], unique=True,
                    postgresql_where=sa.text('deleted_at IS NULL'), sqlite_where=sa.text('deleted_at IS NULL'))


def downgrade():
    op.drop_index('uq_words_word_lower', table_name='words')
