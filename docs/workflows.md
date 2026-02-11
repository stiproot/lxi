
## WORKFLOWS
### SUMMARY
Lxi uses an event driven architecture to orchestrate workflows.

Workflows are a series of steps that are executed in sequence.

Each step data structure is composed of a `cmd` and `proc` structure. Where a `cmd` is executed by a worker (micro-service), and a `proc` is the runtime status of the `cmd`.

When a worker is finished processing a `cmd`, it will publish an event to a `*_RECEIPT` that corresponds with its input topic.

So, `cmds` flow in through a `*_CMD` topic, and then get propogated to a `*_RECEIPT` topic.

The receipt-worker is reponsible for updating the `proc` status of the `cmd` in the workflow data structure.

The receipt-worker is also responsible for executing any post-processing operations that are defined in the `cmd_metadata`.

The receipt-worker will also publish a `*_CMD` event to the next step in the workflow.

Each workflow data structure has a `workflow_hash` that is generated from the serialized sequence of cmds in the workflow. This is used to identify the workflow.

Additionally, in order to identify the `cmd` in the workflow data structure, a `cmd_hash` is generated from the `cmd` data structure.

So, the `cmd_hash` is used to identify the `cmd` in the workflow data structure, and is generated from the `cmd` data structure.
And the `workflow_hash` is used to identify the workflow, and is generated from the serialized sequence of cmds in the workflow.

### WORKFLOW DATA STRUCTURE
```json
{
  "<<unique-project-id>>": {
    "workflows": {
      "<<unique-workflow-id>>": {
        "steps": [
          <<step-struct>>
        ]
      }
    }
  }
}
```

### EXAMPLE
```json
{
  "project-x": {
    "workflows": [
      {
        "workflow_hash": "3f2912a8b44767729b997a753ec6632b37949443befc03c53c622d8c6e9b030f",
        "steps": [
          {
            "cmd": {
              "cmd_type": "EMBED_REPO",
              "cmd_data": {},
              "cmd_metadata": {
                "repo_name": "Lxi",
                "user_id": "usr@lxi.com",
                "workflow_hash": "3f2912a8b44767729b997a753ec6632b37949443befc03c53c622d8c6e9b030f",
                "cmd_hash": "791f5a868b2942f61968452b1f5535908c698ba5641ccc2004fae73622c3a884",
                "cmd_post_op": {
                  "cmd_result_broadcasts": [
                    {
                      "url": "http://lxi-ui-api:6001/broadcast",
                      "static_payload": {
                        "message": "Repo has been embedded.",
                        "user_id": "usr@lxi.com"
                      }
                    }
                  ]
                }
              },
              "cmd_result": {}
            },
            "proc": {
              "target_topic_name": "LEXI_CMD_EMBED",
              "proc_status": "PENDING",
              "proc_err": null,
              "utc_created_timestamp": "2021-09-29T09:00:00.000Z"
            }
          }
        ]
      }
    ]
  }
}
```

```json
{
  "cmd_result_enrichment": {
    "prop_map": [
      {
        "key": "__metadata__",
        "val": {
          "project_id": "project-x",
          "user_id": "usr@lxi.com"
        }
      },
    ]
  }
}
```

```json
{
  "cmd_result_persistence": {
    "target_statestore_name": "statestore-discovery",
    "target_statestore_key": "project-x",
    "target_statestore_partition_key": "project-x",
  }
}
```
