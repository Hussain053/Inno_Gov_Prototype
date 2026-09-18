"""add uniqueness constraints for pilots, evaluations, and contracts

Revision ID: f1a8c43920b1
Revises: e9781a64470a
Create Date: 2026-09-08 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a8c43920b1'
down_revision: Union[str, Sequence[str], None] = 'e9781a64470a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(
        'uq_pilots_challenge_startup',
        'pilots',
        ['challenge_id', 'startup_id']
    )
    op.create_unique_constraint(
        'uq_evaluations_submission_evaluator',
        'evaluations',
        ['pilot_submission_id', 'evaluator_id']
    )
    op.create_unique_constraint(
        'uq_contracts_pilot',
        'contracts',
        ['pilot_id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_contracts_pilot', 'contracts', type_='unique')
    op.drop_constraint('uq_evaluations_submission_evaluator', 'evaluations', type_='unique')
    op.drop_constraint('uq_pilots_challenge_startup', 'pilots', type_='unique')
