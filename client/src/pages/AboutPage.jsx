import {
  Leaf,
  Users,
  Heart,
  Award,
  Target,
  Sparkles,
  ShieldCheck,
  Globe,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary shadow-lg">
              <Leaf className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            About KisaanCredit
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
            Empowering farmers with carbon credits, driving sustainability, and ensuring a greener
            future.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" /> Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-lg leading-relaxed">
              To empower farmers with tools, knowledge, and financial rewards by making sustainable
              farming profitable through carbon credit systems.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" /> Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-lg leading-relaxed">
              A future where every farmer contributes to combating climate change while improving
              livelihoods and ensuring food security.
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-black">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 space-y-4 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Transparency</h3>
                <p className="text-muted-foreground">
                  Clear, verifiable processes with real-time tracking and payouts.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8 space-y-4 text-center">
                <Heart className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Farmer First</h3>
                <p className="text-muted-foreground">
                  Every decision is driven by the goal of improving farmers' lives.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8 space-y-4 text-center">
                <Lightbulb className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Innovation</h3>
                <p className="text-muted-foreground">
                  Leveraging technology to make sustainability easy and profitable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Impact */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-black flex items-center justify-center gap-2">
            <Award className="h-8 w-8" /> Our Impact So Far
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Together with thousands of farmers, we are creating measurable environmental and
            economic change.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <Card>
              <CardContent className="p-8 text-center space-y-2">
                <h3 className="text-4xl font-black text-primary">125K+</h3>
                <p className="font-medium text-muted-foreground">Tons of Carbon Saved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8 text-center space-y-2">
                <h3 className="text-4xl font-black text-primary">45K+</h3>
                <p className="font-medium text-muted-foreground">Carbon Credits Issued</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8 text-center space-y-2">
                <h3 className="text-4xl font-black text-primary">2,300+</h3>
                <p className="font-medium text-muted-foreground">Farmers Empowered</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-12 bg-primary rounded-3xl text-primary-foreground space-y-6">
          <h2 className="text-4xl font-extrabold">Join the Movement</h2>
          <p className="text-lg max-w-2xl mx-auto">
            Be part of a sustainable revolution. Whether you're a farmer or a supporter,
            KisaanCredit is your partner in building a greener tomorrow.
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="secondary" className="px-4 py-2 text-lg">
              Start a Project
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-lg">
              Support Farmers
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
