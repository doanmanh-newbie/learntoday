"""users.last_heartbeat_at: server tự đo phút học (không tin số phút client gửi)

Revision ID: c9d8e7f6a5b4
Revises: f7a8b9c0d1e2
Create Date: 2026-11-05 09:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = 'c9d8e7f6a5b4'
down_revision = 'f7a8b9c0d1e2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('last_heartbeat_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('users', 'last_heartbeat_at')
