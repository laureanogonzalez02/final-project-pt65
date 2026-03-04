"""merge migration heads

Revision ID: 38f3aba6283b
Revises: 7fffc0865cf7, d281845ff5ba
Create Date: 2026-03-03 21:00:40.355408

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '38f3aba6283b'
down_revision = ('7fffc0865cf7', 'd281845ff5ba')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
