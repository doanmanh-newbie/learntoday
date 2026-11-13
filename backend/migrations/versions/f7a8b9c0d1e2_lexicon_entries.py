"""lexicon_entries: từ điển Anh-Việt tích hợp (nhập từ file .mobi)

Revision ID: f7a8b9c0d1e2
Revises: b0a948bf5542
Create Date: 2026-11-04 10:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = 'f7a8b9c0d1e2'
down_revision = 'b0a948bf5542'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'lexicon_entries',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('word', sa.String(length=60), nullable=False),
        sa.Column('ipa', sa.String(length=120), nullable=True),
        sa.Column('pos_list', sa.String(length=120), server_default='', nullable=False),
        sa.Column('main_meaning', sa.Text(), nullable=True),
        sa.Column('example_en', sa.Text(), nullable=True),
        sa.Column('example_vi', sa.Text(), nullable=True),
        sa.Column('see_also', sa.String(length=60), nullable=True),
        sa.Column('has_domain', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('weight', sa.Integer(), server_default='0', nullable=False),
        sa.Column('freq_rank', sa.Integer(), nullable=True),
        sa.Column('data', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lexicon_entries_word', 'lexicon_entries', ['word'], unique=True)
    op.create_index('ix_lexicon_entries_weight', 'lexicon_entries', ['weight'], unique=False)
    if op.get_bind().dialect.name == 'postgresql':
        # Gợi ý khi gõ dùng LIKE 'abc%': trên Postgres cần text_pattern_ops thì chỉ mục mới được dùng
        # (chỉ mục thường không dùng được khi collation không phải "C"). Không nằm trong models nên chỉ tạo ở đây.
        op.execute('CREATE INDEX ix_lexicon_entries_word_prefix ON lexicon_entries (word text_pattern_ops)')


def downgrade():
    if op.get_bind().dialect.name == 'postgresql':
        op.execute('DROP INDEX IF EXISTS ix_lexicon_entries_word_prefix')
    op.drop_index('ix_lexicon_entries_weight', table_name='lexicon_entries')
    op.drop_index('ix_lexicon_entries_word', table_name='lexicon_entries')
    op.drop_table('lexicon_entries')
