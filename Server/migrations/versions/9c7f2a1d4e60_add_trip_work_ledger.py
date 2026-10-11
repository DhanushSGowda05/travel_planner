"""add durable trip workflow ledger

Revision ID: 9c7f2a1d4e60
Revises: 65eb850e9b14
Create Date: 2026-10-10

"""
from alembic import op
import sqlalchemy as sa


revision = "9c7f2a1d4e60"
down_revision = "65eb850e9b14"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trip_work",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("workflow", sa.String(length=20), nullable=False),
        sa.Column("state", sa.String(length=24), nullable=False),
        sa.Column("generation", sa.Integer(), nullable=False),
        sa.Column("celery_task_id", sa.String(length=36), nullable=True),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("dispatch_attempt_count", sa.Integer(), nullable=False),
        sa.Column("enqueued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dispatch_lease_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trip.id"],
            name="fk_trip_work_trip_id_trip",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "trip_id",
            "workflow",
            name="uq_trip_work_trip_workflow",
        ),
    )
    op.create_index(
        "ix_trip_work_dispatch",
        "trip_work",
        ["state", "next_attempt_at"],
        unique=False,
    )
    op.create_index(
        "ix_trip_work_lease",
        "trip_work",
        ["state", "lease_expires_at"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_trip_work_lease", table_name="trip_work")
    op.drop_index("ix_trip_work_dispatch", table_name="trip_work")
    op.drop_table("trip_work")
