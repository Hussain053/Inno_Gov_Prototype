"""create evaluator_assignments table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-08 15:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'evaluator_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pilot_submission_id', sa.Integer(), nullable=False),
        sa.Column('evaluator_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', name='assignmentstatus'), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['evaluator_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pilot_submission_id'], ['pilot_submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pilot_submission_id', 'evaluator_id', name='uq_evaluator_assignments_submission_evaluator')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('evaluator_assignments')
    sa.Enum(name='assignmentstatus').drop(op.get_bind(), checkfirst=False)
