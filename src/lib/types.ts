export type DataSource = "gitlab" | "jira";

export interface TimelogEntry {
  issueTitle: string;
  summary: string;
  timeSpent: string;
  userName: string;
  issueWebUrl: string;
}

export interface TimelogGroups {
  [date: string]: TimelogEntry[];
}

export interface UserTotals {
  [userName: string]: number;
}

export interface TimelogData {
  timelogGroups: TimelogGroups;
  userTotals: UserTotals;
}

export interface GitLabConfig {
  gitlabUrl: string;
  accessToken: string;
}

export interface JiraConfig {
  jiraUrl: string;
  accessToken: string;
  email: string;
}

export interface AppConfig {
  dataSource: DataSource;
  gitlab: GitLabConfig;
  jira: JiraConfig;
}
