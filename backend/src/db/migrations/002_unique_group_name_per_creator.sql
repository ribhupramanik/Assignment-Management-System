CREATE UNIQUE INDEX unique_group_name_per_creator
ON groups (
    created_by,
    LOWER(name)
);