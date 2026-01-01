# Example Usage Scenarios

This document provides practical examples of how to use Tock UI for common time tracking scenarios.

## Scenario 1: Standard Workday Tracking

### Morning - Starting Work
1. Open Tock UI
2. Go to "Start Activity" tab
3. Fill in:
   - Project: `Client Website`
   - Description: `Implementing homepage redesign`
4. Click "Start Activity"

### Midday - Switching Tasks
1. Go to "Stop Activity" tab
2. Click "Stop Activity"
3. Go to "Start Activity" tab
4. Fill in:
   - Project: `Internal Tools`
   - Description: `Bug fixes in dashboard`
5. Click "Start Activity"

### Afternoon - Meeting
1. Stop current activity
2. Add new activity:
   - Project: `Client Website`
   - Description: `Client meeting - requirements discussion`
3. Start new activity

### End of Day - Review
1. Go to "Reports" tab
2. Click "Today"
3. Review your time distribution

## Scenario 2: Logging Forgotten Work

### You forgot to track morning work
1. Go to "Add Past Activity" tab
2. Fill in:
   - Project: `Documentation`
   - Description: `Writing API documentation`
   - Start: `09:00`
   - End: `11:30`
3. Click "Add Activity"

### You know the duration but not exact end time
1. Go to "Add Past Activity" tab
2. Fill in:
   - Project: `Code Review`
   - Description: `Reviewing pull requests`
   - Start: `14:00`
   - Duration: `1h30m`
3. Click "Add Activity"

## Scenario 3: Continuing Previous Work

### Resuming yesterday's task
1. Go to "Recent Activities" tab
2. Note the project and description of the task you want to continue
3. Go to "Start Activity" tab
4. Enter the same project and description
5. Click "Start Activity"

## Scenario 4: Multi-Project Day

### Morning: Project A
```
Project: Backend API
Description: Implementing user authentication
Start Time: (leave empty for "now")
```

### Late Morning: Project B
```
Stop current activity
Project: Mobile App
Description: Fixing iOS login bug
```

### Lunch Break
```
Stop activity
(No tracking during lunch)
```

### Afternoon: Back to Project A
```
Project: Backend API
Description: Writing tests for authentication
```

### Late Afternoon: Project C
```
Stop current activity
Project: DevOps
Description: Setting up CI/CD pipeline
```

## Scenario 5: Client Billing

### Tracking billable hours
Throughout the day, use consistent project names for each client:

```
Client Alpha:
- "Developing feature X"
- "Code review session"
- "Client meeting"

Client Beta:
- "Bug fixing in module Y"
- "Performance optimization"
```

### End of week review
1. Generate reports for each day:
   - Monday through Friday
2. Export or copy the report text
3. Calculate total hours per client
4. Create invoice based on tracked time

## Scenario 6: Personal Productivity

### Tracking study sessions
```
Project: Learning Rust
Description: Reading The Rust Book - Chapter 5
Duration: 2h
```

### Side project work
```
Project: Personal Blog
Description: Writing new article on time management
Start: 20:00
End: 22:30
```

## Scenario 7: Remote Work

### Starting remote work session
```
1. Open Tock UI at work start time
2. Start activity with remote work project
3. Keep Tock UI open and visible
4. Check "Current Activity" periodically
```

### Context switching
```
When switching between tasks:
1. Stop current activity
2. Start new activity with new description
3. Verify in "Current Activity" tab
```

## Scenario 8: Team Standup Preparation

### Before standup
1. Go to "Reports" tab
2. Click "Yesterday"
3. Review what you worked on
4. Go to "Current Activity" to see what's ongoing
5. Use this information in your standup

## Tips for Effective Usage

### Best Practices
1. **Be Specific**: Use descriptive task descriptions
2. **Consistent Naming**: Use the same project names
3. **Regular Checks**: Periodically verify the current activity
4. **Daily Review**: Check reports at end of day
5. **Immediate Logging**: Start tracking as soon as you begin work

### Common Patterns

**Task Switching:**
```
Stop → Start New Activity
```

**Break Time:**
```
Stop (before break)
Start (after break)
```

**Forgot to Start:**
```
Use "Add Past Activity" immediately when you remember
```

**Quick Check:**
```
Current Activity tab → Verify active tracking
```

## Integration with CLI

You can use both the UI and CLI interchangeably:

1. **Start in UI**: Track activities via the GUI
2. **Check in CLI**: Run `tock current` in terminal
3. **Stop in CLI**: Run `tock stop` from anywhere
4. **View in UI**: Refresh to see CLI changes

All changes are reflected in both interfaces since they use the same data files.

## Troubleshooting Common Mistakes

### Forgot to stop previous activity
```
1. Stop current (unwanted) activity
2. Use "Add Past Activity" to correct the times
```

### Wrong project name
```
1. Stop activity
2. Start new one with correct project name
3. Manually edit the data file if needed
```

### Lost track of time
```
1. Check "Recent Activities"
2. Estimate durations
3. Add past activities as needed
```
