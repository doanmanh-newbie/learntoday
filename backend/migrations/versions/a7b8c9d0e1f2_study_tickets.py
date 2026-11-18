"""study_tickets: vé phiên học (chống gian lận tiến độ/bảng xếp hạng)

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-11-16 17:30:00
"""
from alembic import op
import sqlalchemy as sa

revision = 'a7b8c9d0e1f2'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'study_tickets',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kind', sa.String(10), nullable=False),
        sa.Column('word_ids', sa.Text(), nullable=False),
        sa.Column('done_ids', sa.Text(), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_study_tickets_user_issued', 'study_tickets', ['user_id', 'issued_at'])


def downgrade():
    op.drop_index('idx_study_tickets_user_issued', table_name='study_tickets')
    op.drop_table('study_tickets')
