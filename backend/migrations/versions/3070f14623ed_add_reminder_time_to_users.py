"""add reminder_time to users

Revision ID: 3070f14623ed
Revises: 86dd0fb98bbe
Create Date: 2026-08-11 15:31:09.002461

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3070f14623ed'
down_revision = '86dd0fb98bbe'
branch_labels = None
depends_on = None


FK_NAME = 'refresh_tokens_user_id_fkey'      # tên Postgres tự đặt cho FK ở migration đầu tiên


def _is_postgres():
    return op.get_bind().dialect.name == 'postgresql'


def upgrade():
    # Đổi FK refresh_tokens.user_id sang ON DELETE CASCADE. Chỉ cần với Postgres: SQLite không
    # ép FK mặc định và (vì FK không có tên) không thể drop theo tên trong chế độ batch.
    if _is_postgres():
        with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
            batch_op.drop_constraint(FK_NAME, type_='foreignkey')
            batch_op.create_foreign_key(FK_NAME, 'users', ['user_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('reminder_time', sa.Time(), nullable=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('reminder_time')

    if _is_postgres():
        # Trước đây gọi drop_constraint(None, ...) -> lỗi vì thiếu tên ràng buộc
        with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
            batch_op.drop_constraint(FK_NAME, type_='foreignkey')
            batch_op.create_foreign_key(FK_NAME, 'users', ['user_id'], ['id'])
