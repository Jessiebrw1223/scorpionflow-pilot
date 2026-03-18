using MongoDB.Driver;
using ScorpionFlow.API.Models;

namespace ScorpionFlow.API.Services;

public class ProjectService
{
    private readonly IMongoCollection<Project> _projectsCollection;

    public ProjectService(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDbSettings:ConnectionString"];
        var databaseName = configuration["MongoDbSettings:DatabaseName"];
        var collectionName = configuration["MongoDbSettings:ProjectsCollectionName"];

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);

        _projectsCollection = database.GetCollection<Project>(collectionName);
    }

    public async Task<List<Project>> GetAllAsync()
    {
        return await _projectsCollection.Find(_ => true).ToListAsync();
    }

    public async Task CreateAsync(Project project)
    {
        await _projectsCollection.InsertOneAsync(project);
    }
}
    };

    public List<Project> GetAll()
    {
        return _projects;
    }
}
