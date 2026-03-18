using ScorpionFlow.API.Models;

namespace ScorpionFlow.API.Services;

public class ProjectService
{
    private readonly List<Project> _projects = new()
    {
        new Project
        {
            Id = 1,
            Code = "ALPHA",
            Name = "Project Alpha",
            Description = "Proyecto de control financiero",
            Budget = 150000,
            Spent = 98500,
            ProgressPercent = 62,
            Status = "En Riesgo"
        },
        new Project
        {
            Id = 2,
            Code = "BETA",
            Name = "Project Beta",
            Description = "Proyecto de gestión de recursos",
            Budget = 85000,
            Spent = 42000,
            ProgressPercent = 45,
            Status = "En Tiempo"
        }
    };

    public List<Project> GetAll()
    {
        return _projects;
    }
}