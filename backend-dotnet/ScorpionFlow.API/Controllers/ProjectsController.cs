using Microsoft.AspNetCore.Mvc;

namespace ScorpionFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetProjects()
        {
            var projects = new[]
            {
                new { Id = 1, Name = "Project Alpha", Budget = 150000 },
                new { Id = 2, Name = "Project Beta", Budget = 85000 },
                new { Id = 3, Name = "Project Gamma", Budget = 200000 }
            };

            return Ok(projects);
        }
    }
}