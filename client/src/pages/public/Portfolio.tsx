/**
 * Portfolio Page
 * Premium masonry grid of projects
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProjectCard } from '../../components/ProjectCard';
import { FAQSection } from '../../components/FAQSection';
import { Button } from '../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { adminProjectsApi } from '../../api/adminProjects.api';

export default function Portfolio() {
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await adminProjectsApi.getPortfolio();
        const data = response.data.data;
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Derive unique categories from API data
  const categories = ["All", ...Array.from(new Set(projects.map((p: any) => p.category).filter(Boolean)))];

  const filteredProjects = filter === "All"
    ? projects
    : projects.filter((p: any) => p.category === filter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/10 py-24 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Our <span className="text-primary">Masterpieces</span></h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A curated selection of our most impactful projects across web, mobile, and AI technologies.
            </p>
          </motion.div>

          {/* Filters */}
          {!isLoading && !hasError && categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-3 pt-8">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={filter === cat ? "default" : "outline"}
                  onClick={() => setFilter(cat)}
                  className="rounded-full px-6 transition-all duration-300"
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : hasError ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Unable to load projects at this time. Please try again later.</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project: any) => {
                  const id = project._id || project.id;
                  const image = project.coverImage || (project.images && project.images[0]) || 'https://placehold.co/800x600/1a1a2e/ffffff?text=Project';
                  const tags = project.techStack || project.tags || [];
                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="h-[400px]"
                    >
                      <ProjectCard
                        title={project.title}
                        category={project.category || 'Project'}
                        image={image}
                        tags={tags}
                        slug={id}
                        onClick={() => navigate(`/portfolio/${id}`)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No projects found in this category.</p>
                <Button variant="link" onClick={() => setFilter("All")}>Clear Filters</Button>
              </div>
            )}
          </>
        )}

        <FAQSection
          title="Project FAQs"
          description="Common questions about our project workflow and delivery."
          items={[
            { question: "Do you sign NDAs?", answer: "Yes, we are happy to sign an NDA before discussing your project details." },
            { question: "Do I own the code?", answer: "Absolutely. Once the project is paid for, you own 100% of the IP." },
            { question: "What is your hourly rate?", answer: "We primarily work on fixed-project basis, but our blended hourly rate is around $120-$150/hr for T&M." }
          ]}
          className="mt-32 bg-card rounded-3xl border border-border/50"
        />
      </div>
    </div>
  );
}
