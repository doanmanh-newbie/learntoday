"""merge multiple heads

Revision ID: f942a2898554
Revises: 5d418b51cdd8, e5f6a7b8c9d0
Create Date: 2026-10-21 15:22:10.890213

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f942a2898554'
down_revision = ('5d418b51cdd8', 'e5f6a7b8c9d0')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
