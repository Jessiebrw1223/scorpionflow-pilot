namespace ScorpionFlow.API.Models;

public class Project
{
    public int Id { get; set; }

    public string Code { get; set; } = "";

    public string Name { get; set; } = "";

    public string Description { get; set; } = "";

    public decimal Budget { get; set; }

    public decimal Spent { get; set; }

    public int ProgressPercent { get; set; }

    public string Status { get; set; } = "";
}