export default interface JiraIssuePluginSettings {
	token: string;
	host: string;
	port: number;
	dayHours: number;
	functionTeam: string;
}

export const DEFAULT_SETTINGS: JiraIssuePluginSettings = {
	token: '',
	host: '',
	port: 443,
	dayHours: 8,
	functionTeam: 'N/A'
}
