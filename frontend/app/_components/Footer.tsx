const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <span className="text-2xl font-bold tracking-tight">
              GENAI<span className="text-primary">✦</span>
            </span>
            <p className="mt-4 text-background/70 text-sm">
              Empowering businesses with intelligent automation and seamless integration.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-background transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">About</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm text-background/50">
          © 2025 GENAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
