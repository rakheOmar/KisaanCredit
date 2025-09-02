import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Leaf, TwitterIcon, GithubIcon, FacebookIcon, LinkedinIcon } from "lucide-react";

const footerLinks = [
  {
    title: "About Us",
    href: "#about",
  },
  {
    title: "Services",
    href: "#services",
  },
  {
    title: "Contact",
    href: "#contact",
  },
  {
    title: "Blog",
    href: "#blog",
  },
  {
    title: "Help Center",
    href: "#help",
  },
  {
    title: "Privacy Policy",
    href: "#privacy",
  },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/email/newsletter`, {
        email,
      });
      setEmail("");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 flex flex-col sm:flex-row items-start justify-between gap-x-8 gap-y-10 px-6 xl:px-0">
          <div>
            {/* KisaanCredit Logo */}
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-green-600" />
              <span className="text-xl font-bold text-foreground">KisaanCredit</span>
            </div>

            {/* Footer Links */}
            <ul className="mt-6 flex items-center gap-4 flex-wrap">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <a href={href} className="text-muted-foreground hover:text-foreground">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="max-w-xs w-full">
            <h6 className="font-semibold">Stay up to date</h6>
            <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>

        <Separator />

        {/* Bottom Bar */}
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
          <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()} KisaanCredit. All rights reserved.
          </span>

          <div className="flex items-center gap-5 text-muted-foreground">
            <a href="#" target="_blank" rel="noopener noreferrer">
              <TwitterIcon className="h-5 w-5 hover:text-foreground" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FacebookIcon className="h-5 w-5 hover:text-foreground" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <LinkedinIcon className="h-5 w-5 hover:text-foreground" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <GithubIcon className="h-5 w-5 hover:text-foreground" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
