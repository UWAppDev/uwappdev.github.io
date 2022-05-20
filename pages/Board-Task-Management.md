---
layout: page
title: Task Management
---
To make sure we deliver impactful results in a timely manager, the Board of App Development Club @ UW uses [organization project boards](https://github.com/orgs/UWAppDev/projects?type=beta) to keep track of tasks. For example, [Sprint](https://github.com/orgs/UWAppDev/projects/4) is for general RSO management. One Board Member serves as the "Task Manager" and is in charge of overseeing the project boards.

## Project Board Fields Explained

For each task, there is some additional info that assists the Task Manager and the team reach the finish line.

### Assignee, Status

A task is created by the Task Manager and assigned to an assignee in charge of/leading completing a task. The Assignee should update the Status of the task to accurately reflect the current progress. All issues with Status "Done" should be closed, and vice versa.

Each task should generally be broken down into many small and actionable parts by the Assignee, and the Assignee may add follow-up tasks linked as a child issue.

The original task is the `Epic` and should have a **TODO list** with each item linking to one of its child tasks. See https://github.com/UWAppDev/Board/issues/12 for an example.

### Estimate

For each task, the Assignee should research and determine the estimated **story point** based on the complexity and potential risks of completing that task. It's hard to come up with an accurate estimate, but spending more time in the planning stage and plotting out the path moving forward with details should help.

|Story Point|Usage|
|:--:|--|
|0|Reserved for `Epic`s, as they serve as the parent of many smaller tasks and there's no action required.|
|1|A very simple task, requires little to no effort.|
|2|A task that requires some effort, usually completable within a day.|
|3|A task that may take a day or more (factor in your other usual activities, school work, etc.).|
|5|Require a few (3~5) days of effort and a significant amount of work.|
|8|Has a lot of uncertainty, and in general should be divided into smaller, more actionable tasks after investigation.|

> The recommended story point total is ~20 per person per cycle.

### Milestone, Priority, Due, Cycle

In general, milestones correspond to each academic quarter, and all tasks in a milestone are due before the end of that quarter. Cycles represent 2-week windows within each quarter and start the day after a Board meeting.

The Task Manager and the Assignee should discuss and set the Priority, Milestone, and Cycle of `Epic` tasks. If there's a hard deadline for a task, the Due date should also be set and the Task Manager should ensure the task is completed before.

The Assignee may set these 4 fields for the child tasks as they see fit. The Activity Monitor may update these 4 fields with permission of the Assignee, or when the Assignee is on peace-out period.

### Labels

Optionally, the Assignee/Task Manager/Activity Monitor can add relevant labels to a task (in addition to `Epic`) as desired.

## Task Manager/Activity Monitor

### Responsibilities

The Task Manager and Activity Monitor are Board members responsible to ensure all tasks are done as planned, keeping the Board on track to deliver impactful results in a timely manner.

#### Task Manager

1. Add tasks resulted from an ended Board meeting to the [Sprint](https://github.com/orgs/UWAppDev/projects/4) board
   - The earlier the better, and no later than 24 hours after the meeting ends
   - Post in the Discord thread reminding other `@Board Members` to fill in missing fields
2. Setup upcoming Board meeting
   - Maintain Google Calendar for Board events and meetings
      - Make and link the upcoming Board meeting agenda in the calendar invite
      - Add unfinished discussion items from the previous Board meeting record to the next Board meeting agenda
   - Make a thread on Discord in `#board-general` channel for the upcoming Board meeting 
      - The initial message should include the date, time, duration, and location of the meeting
      - Thread title should be the meeting date in format `yyyy-MM-dd` (e.g. 2021-12-31 for December 31, 2021)
3. Add items to discuss in the upcoming Board meeting agenda, and the estimated time required
   - If the estimated total time is longer than scheduled
      - Try to restructure the meeting to contain fewer agenda items, and discuss things asynchronously instead
      - Else, update Google Calendar invite to reflect the new meeting length, and announce the new duration in the thread
4. Check on the Activity Monitor (at least weekly) on the progress of tasks

#### Activity Monitor

1. Remind Board members of upcoming once the agenda is ready
   - Post the meeting agenda link in the thread at least 1 day before the meeting
      - Check-in with the Task Manager to ensure the agenda is done on time
   - Send out a reminder `@Board Member` in the thread...
      - at the time of meeting for online/hybrid ones, or 
      - 10 minutes before the meeting for in-person ones.
2. Take notes during Board meetings, including the attendance of Board members
3. Check on the Board members (including the Task Manager, at least weekly) on the progress of tasks
   - Help (finding resources for) identifying/resolving blockers preventing tasks to be done on time
   - Help update Sprint board if outdated, but encourage Board members to update it themselves
4. Redistribute task or update task cycle if needed, especially in response to unscheduled Board member peace-out period.

### Rotations

The Task Manager/Activity Monitor pair rotates every academic quarter. The Task Manager/Activity Monitor pair for a quarter should decide on who serves which role, and at which week they switch (if any) no later than 2 weeks before a quarter starts.

When rotating/switching:

- **Task Manager** responsibilities 1, 2, and 4 are done by the prior Task Manager, and responsibility 3 is done by the upcoming one.
- **Activity Monitory** responsibilities 3 and 4 are done by the prior Activity Monitor, and responsibilities 1 and 2 are done by the upcoming one.

> It is recommended to serve a role at least 6 weeks consecutively before switching so 

#### Unscheduled Peace-out Period

> For a scheduled peace-out period, please follow the normal procedure.

If either the Task Manager or Activity Monitor begins an unscheduled peace-out period, the other one not on peace-out period should become both the Task Manager and the Activity Monitor, then re-distribute the tasks/update task time-span as needed.

If both the Task Manager and the Activity Monitor begin an unscheduled peace-out period, the upcoming Task Manager/Activity Monitor pair becomes the interim Task Manager/Activity Monitor.

Repeat this process until a Task Manager/Activity Monitor is available.

If no Task Manager/Activity Monitor pair is available, 😢.
