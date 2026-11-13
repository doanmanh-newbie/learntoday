"""dictionary_entries: kho từ điển lưu trong database

Revision ID: e5f6a7b8c9d0
Revises: c3d4e5f6a7b8
Create Date: 2026-10-20 09:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'dictionary_entries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('word', sa.String(length=60), nullable=False),
        sa.Column('found', sa.Boolean(), nullable=False),
        sa.Column('data', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=40), nullable=True),
        sa.Column('lookups', sa.Integer(), server_default='0', nullable=False),
        sa.Column('fetched_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('dictionary_entries', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dictionary_entries_word'), ['word'], unique=True)


def downgrade():
    with op.batch_alter_table('dictionary_entries', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_dictionary_entries_word'))
    op.drop_table('dictionary_entries')
