# GitLab Timelog Reports

A modern web application for generating formatted reports from GitLab timelogs with easy date selection and copyable output.

## Features

- 📅 **Smart Date Selection**: Choose from preset options (yesterday, auto weekend detection, last 7 days) or pick custom date ranges
- 🔍 **Formatted Display**: Clean, organized view of timelog entries grouped by user
- 📋 **Copy-Friendly Output**: One-click copy for individual users or complete reports
- 🌓 **Dark Mode Support**: Automatic theme detection and manual toggle
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- ⚡ **Real-time Data**: Fetches live data from GitLab via GraphQL API

## Setup

### Prerequisites

- Node.js 18+ 
- GitLab instance with API access
- GitLab Personal Access Token with `read_api` scope

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your GitLab configuration:
   ```env
   GITLAB_API_URL=https://your-gitlab-instance.com/api/graphql
   GITLAB_ACCESS_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Select Dates**: Use the date picker to choose which days to fetch timelog data for
   - **Yesterday**: Get data for the previous day
   - **Auto**: Smart weekend detection (Friday-Sunday on Mondays, yesterday otherwise)
   - **Last 7 Days**: Get data for the past week
   - **Custom Range**: Pick any date range using the calendar

2. **Generate Report**: Click "Generate Report" to fetch data from GitLab

3. **View Results**: 
   - See summary totals by user
   - View detailed entries with issue links
   - Click external link icons to open GitLab issues

4. **Copy Data**:
   - Copy individual user reports
   - Copy complete formatted report
   - Use copied text in Slack, emails, or other tools

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GITLAB_API_URL` | GitLab GraphQL API endpoint | `https://gitlab.example.com/api/graphql` |
| `GITLAB_ACCESS_TOKEN` | Personal access token with `read_api` scope | `glpat-xxxxxxxxxxxxxxxxxxxx` |

## GitLab Configuration

The application queries the `btv-applications` group by default. To customize this:

1. Edit `src/app/api/timelogs/route.ts`
2. Update the `fullPath` in the GraphQL query:
   ```graphql
   group(fullPath: "your-group-name") {
   ```

## Development

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **TypeScript**: Full type safety
- **API**: Next.js API routes for GitLab integration

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
