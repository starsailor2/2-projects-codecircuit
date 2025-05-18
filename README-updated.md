# CodeCircuit - Developer Productivity Tools

CodeCircuit is a collection of productivity tools designed for developers. Each tool is designed to help with different aspects of development workflow.

## Project Structure

The project has been organized into a modular folder structure:

```
├── index.html            # Main dashboard
├── styles/               # Global styles
│   ├── animations.css
│   ├── dashboard.css
│   └── main.css
├── scripts/              # Global scripts
│   ├── main.js
│   ├── theme-switcher.js
│   └── style-helpers.js
└── tools/                # Individual tools
    ├── task-list/        # Task management tool
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── sticky-notes/     # Sticky notes tool
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── pomodoro/         # Pomodoro timer
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── markdown/         # Markdown editor
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── calendar/         # Weekly calendar
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── timezone/         # Time zone converter
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── json-viewer/      # JSON viewer/editor
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── mindmap/          # Mind map builder
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    ├── snippets/         # Code snippet manager
    │   ├── index.html
    │   ├── scripts/
    │   └── styles/
    └── regex/            # Regex tester
        ├── index.html
        ├── scripts/
        └── styles/
```

## Available Tools

1. **Task List**: Manage your tasks with priority levels and track progress
2. **Sticky Notes**: Create and manage editable note tiles
3. **Pomodoro Timer**: Stay focused with a simple Pomodoro timer
4. **Markdown Notes**: Write notes with Markdown and preview the result
5. **Weekly Calendar**: Plan your week with draggable task blocks
6. **Time Zone Converter**: Convert times between different time zones
7. **JSON Viewer/Editor**: View and edit JSON with collapsible nodes
8. **Mind Map Builder**: Create mind maps with auto-expanding nodes
9. **Snippet Manager**: Store and search code snippets by language
10. **Regex Tester**: Test regular expressions with color-coded match highlights

## How to Use

1. Open `index.html` to access the main dashboard
2. Click on any tool card to open that specific tool
3. Use the "Back to Dashboard" link to return to the main page

## Development

Each tool is now modular and can be developed independently. To work on a specific tool:

1. Navigate to the tool's folder (e.g., `tools/task-list/`)
2. Edit the HTML, CSS, and JavaScript files specific to that tool
3. Use the global scripts and styles for consistent theming and functionality

## Future Enhancements

- Add more developer productivity tools
- Implement user authentication to save personal settings
- Add export/import functionality for each tool
- Create a unified settings page
