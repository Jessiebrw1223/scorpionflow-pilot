using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ScorpionFlow.API.Models;

[BsonIgnoreExtraElements]
public class Project
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = "";

    [BsonElement("code")]
    public string Code { get; set; } = "";

    [BsonElement("name")]
    public string Name { get; set; } = "";

    [BsonElement("description")]
    public string Description { get; set; } = "";

    [BsonElement("budget")]
    public decimal Budget { get; set; }

    [BsonElement("spent")]
    public decimal Spent { get; set; }

    [BsonElement("progressPercent")]
    public int ProgressPercent { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "";
}