using Microsoft.AspNetCore.Mvc;
using ScorpionFlow.API.Models;
using ScorpionFlow.API.Services;

namespace ScorpionFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly ProjectService _projectService;

        public ProjectsController(ProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Project>>> Get()
        {
            var projects = await _projectService.GetAllAsync();
            return Ok(projects);
        }

        [HttpPost]
        public async Task<ActionResult> Create(Project project)
        {
            await _projectService.CreateAsync(project);
            return Ok(project);
        }
    }
}