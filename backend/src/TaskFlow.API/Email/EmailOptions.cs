namespace TaskFlow.API.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
    public string DefaultLanguage { get; set; } = "pt-BR";
    public SmtpOptions Smtp { get; set; } = new();

    public sealed class SmtpOptions
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FromAddress { get; set; } = string.Empty;
        public string FromName { get; set; } = "TaskFlow";
        public bool UseSslOnConnect { get; set; }

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(Host) &&
            !string.IsNullOrWhiteSpace(FromAddress) &&
            Port is > 0 and <= 65535 &&
            (string.IsNullOrWhiteSpace(Username) || !string.IsNullOrWhiteSpace(Password));
    }
}
