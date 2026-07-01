# NocoDB Schema

NocoDB is the workflow source of truth.

## Tables

### projects

- id
- name
- slug
- description
- status
- repository_url
- local_path
- default_branch
- tech_stack
- ai_context_path
- created_at
- updated_at

### tasks

- id
- project_id
- title
- description
- status
- priority
- type
- estimate_days
- estimate_hours
- assigned_agent
- provider_id
- acceptance_criteria
- related_files
- related_docs
- branch_name
- progress
- ai_confidence
- dependencies
- blocked_reason
- created_at
- updated_at

Statuses:

- backlog
- todo
- in_progress
- review
- testing
- done
- blocked

### task_plans

- id
- project_id
- task_id
- title
- objective
- scope
- out_of_scope
- plan_steps
- risks
- dependencies
- assumptions
- estimated_effort
- created_by_agent
- created_at

### schedules

- id
- project_id
- task_id
- plan_id
- day_index
- scheduled_date
- title
- description
- expected_output
- status
- created_at
- updated_at

### daily_logs

- id
- project_id
- task_id
- date
- summary
- completed_items
- blockers
- next_steps
- changed_files
- notes
- agent_id
- provider_id
- created_at

### weekly_logs

- id
- project_id
- week_start
- week_end
- summary
- completed_tasks
- pending_tasks
- blockers
- decisions
- next_week_plan
- created_at

### project_context_updates

- id
- project_id
- task_id
- update_type
- title
- description
- affected_docs
- affected_files
- decision
- reason
- created_by_agent
- created_at

### agent_runs

- id
- project_id
- task_id
- agent_name
- provider_id
- model
- skill
- status
- input_summary
- output_summary
- started_at
- finished_at
- error_message

### agent_logs

- id
- run_id
- project_id
- task_id
- level
- message
- metadata
- created_at

### providers

- id
- name
- type
- base_url
- default_model
- fallback_order
- is_active
- supports_reasoning
- supports_tools
- created_at
- updated_at

### skills

- id
- name
- command
- description
- required_inputs
- output_target
- is_active
- created_at

### decisions

- id
- project_id
- title
- decision
- reason
- alternatives
- impact
- created_at

### blockers

- id
- project_id
- task_id
- title
- description
- severity
- status
- resolution
- created_at
- resolved_at
