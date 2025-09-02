import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  Leaf,
  Users,
  Award,
  IndianRupee,
  TreePine,
  Sparkles,
  Crown,
  Medal,
  ChevronRight,
  Trophy,
  Target,
  Smile,
  Meh,
  Frown,
  Star,
  Quote,
  Heart,
  MapPin,
  Zap,
} from "lucide-react";
import Marquee from "@/components/ui/marquee";
import axiosInstance from "@/lib/axios";

export default function Home() {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState([]);
  const [stats, setStats] = useState({
    totalCarbon: 125000,
    totalCredits: 45678,
    activeFarmers: 2340,
    moneyDistributed: 15600000,
  });
  const [sentiment] = useState({
    positive: 78,
    neutral: 15,
    negative: 7,
  });

  const farmerReviews = [
    {
      id: 1,
      name: "Rajesh Kumar",
      location: "Maharashtra",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      review:
        "This platform changed my farming life! Earned ₹85,000 last year from carbon credits.",
      rating: 5,
      creditsEarned: 1250,
      cropType: "Organic Rice",
    },
    {
      id: 2,
      name: "Priya Sharma",
      location: "Punjab",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616c88275b6?w=80&h=80&fit=crop&crop=face",
      review:
        "Amazing support team and transparent process. My sustainable farming is now profitable!",
      rating: 5,
      creditsEarned: 980,
      cropType: "Wheat",
    },
    {
      id: 3,
      name: "Suresh Patel",
      location: "Gujarat",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      review: "Easy to use platform with real-time tracking. Perfect for modern farmers like us.",
      rating: 4,
      creditsEarned: 750,
      cropType: "Cotton",
    },
    {
      id: 4,
      name: "Meera Joshi",
      location: "Rajasthan",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      review:
        "The verification process is smooth and payments are always on time. Highly recommended!",
      rating: 5,
      creditsEarned: 1100,
      cropType: "Bajra",
    },
    {
      id: 5,
      name: "Amit Singh",
      location: "Uttar Pradesh",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
      review: "Great initiative for sustainable farming. My income increased by 40% this year!",
      rating: 5,
      creditsEarned: 890,
      cropType: "Sugarcane",
    },
    {
      id: 6,
      name: "Kavita Reddy",
      location: "Karnataka",
      image:
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=80&h=80&fit=crop&crop=face",
      review: "Technology made simple for farmers. Love the mobile app and instant notifications.",
      rating: 4,
      creditsEarned: 650,
      cropType: "Coffee",
    },
    {
      id: 7,
      name: "Vikram Choudhary",
      location: "Haryana",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
      review: "Best decision I made for my farm. Carbon credits are the future of agriculture!",
      rating: 5,
      creditsEarned: 1320,
      cropType: "Mustard",
    },
    {
      id: 8,
      name: "Sunita Yadav",
      location: "Madhya Pradesh",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
      review: "Simple registration process and excellent customer service. Highly satisfied!",
      rating: 5,
      creditsEarned: 920,
      cropType: "Soybean",
    },
  ];

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const res = await axiosInstance.get(`/users/credits/top`, {
          headers: { "Cache-Control": "no-cache" },
          params: { ts: Date.now() },
        });

        const raw = Array.isArray(res?.data?.data) ? res.data.data : [];

        // Normalize and coerce values
        const cleaned = raw.map((u, i) => {
          const username =
            u?.username ||
            (u?.fullName ? u.fullName.replace(/\s+/g, "").toLowerCase() : `user_${i + 1}`);
          const fullName = u?.fullName || u?.username || "Unknown";
          const carbonCredits = Number(u?.carbonCredits ?? 0);
          const moneyEarned = Number(u?.moneyEarned ?? 0);
          const avatar = u?.avatar || "";

          return {
            _id: u?._id || `${username}_${i}`,
            username,
            fullName,
            avatar,
            role: u?.role || "Farmer",
            carbonCredits: Number.isFinite(carbonCredits) ? carbonCredits : 0,
            moneyEarned: Number.isFinite(moneyEarned) ? moneyEarned : 0,
          };
        });

        // Sort by credits desc to build the leaderboard
        const sorted = cleaned.sort((a, b) => b.carbonCredits - a.carbonCredits);

        setTopUsers(sorted);
      } catch (error) {
        const dummyUsers = [
          {
            _id: "1",
            username: "farmer_raj",
            fullName: "Rajesh Kumar",
            carbonCredits: 1250,
            moneyEarned: 87500,
          },
          {
            _id: "2",
            username: "green_priya",
            fullName: "Priya Sharma",
            carbonCredits: 1180,
            moneyEarned: 82600,
          },
          {
            _id: "3",
            username: "eco_suresh",
            fullName: "Suresh Patel",
            carbonCredits: 1095,
            moneyEarned: 76650,
          },
          {
            _id: "4",
            username: "nature_amit",
            fullName: "Amit Singh",
            carbonCredits: 980,
            moneyEarned: 68600,
          },
          {
            _id: "5",
            username: "carbon_meera",
            fullName: "Meera Joshi",
            carbonCredits: 875,
            moneyEarned: 61250,
          },
        ];
        setTopUsers(dummyUsers);
      }
    };

    fetchTopUsers();

    const interval = setInterval(() => {
      setStats((prev) => ({
        totalCarbon: prev.totalCarbon + Math.floor(Math.random() * 5),
        totalCredits: prev.totalCredits + Math.floor(Math.random() * 3),
        activeFarmers: prev.activeFarmers + Math.floor(Math.random() * 2),
        moneyDistributed: prev.moneyDistributed + Math.floor(Math.random() * 1000),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const PodiumCard = ({ user, rank }) => {
    if (!user) return null;
    const podiumHeights = ["h-32", "h-24", "h-28"];
    const podiumColors = ["bg-primary", "bg-muted", "bg-secondary"];
    const icons = [Crown, Medal, Award];
    const Icon = icons[rank - 1];

    return (
      <div className="relative flex flex-col items-center">
        <div
          className={`${podiumHeights[rank - 1]} w-28 rounded-t-2xl flex items-end justify-center pb-4 mb-4 ${podiumColors[rank - 1]} shadow-md`}
        >
          <div className="relative z-10 text-primary-foreground font-black text-3xl">{rank}</div>
        </div>
        <Card className="w-40">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-primary">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-lg">{user.username || "—"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.fullName || "—"}</p>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-center space-x-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-sm font-bold">
                    {(user.carbonCredits ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    })}{" "}
                    Credits
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <IndianRupee className="h-3 w-3 text-primary" />
                  <span className="text-sm font-semibold">
                    ₹
                    {(user.moneyEarned ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, suffix }) => (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-4xl font-black">
              {typeof value === "number" ? value.toLocaleString() : value}
              <span className="text-2xl font-bold">{suffix}</span>
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-muted">
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MarqueeReviewCard = ({ review }) => (
    <Card className="mx-4 w-80 h-72 flex-shrink-0 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-muted/50 to-background border">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start space-x-3 mb-4">
          <div className="relative flex-shrink-0">
            <img
              src={review.image}
              alt={review.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-border"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
              <Heart className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-base truncate">{review.name}</h4>
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{review.location}</span>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {review.cropType}
              </Badge>
            </div>
          </div>
        </div>

        <div className="relative flex-1 mb-4">
          <Quote className="h-4 w-4 text-primary absolute -top-1 -left-1" />
          <p className="text-sm text-muted-foreground italic pl-6 leading-relaxed">
            {review.review}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t mt-auto">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{review.creditsEarned} Credits</span>
          </div>
          <Badge className="text-xs px-3 py-1">Verified</Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HERO: Left text, right image */}
        <div className="min-h-screen flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full">
            {/* Left: text & CTAs */}
            <div className="flex flex-col justify-center text-center lg:text-left px-4 sm:px-6 lg:px-8 lg:pr-12">
              <div className="flex justify-center lg:justify-start mb-8">
                <Leaf className="h-20 w-20 text-primary" />
              </div>
              <div className="space-y-4 mb-12">
                <h1 className="text-7xl font-black mb-2">NABARD H2S</h1>
              </div>
              <p className="text-xl mb-12 font-medium">
                Revolutionizing carbon credit management for farmers.{" "}
                <span className="font-bold">Sustainable future, profitable present.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-6 lg:justify-start justify-center">
                <Button onClick={() => navigate("/dashboard-project/create-project")}>
                  <TreePine className="h-6 w-6 mr-3" />
                  Start Your Project
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/estimate-earnings")}>
                  <IndianRupee className="h-6 w-6 mr-3" />
                  Calculate Earnings
                </Button>
              </div>
            </div>

            {/* Right: image mockup - extends to screen edge and is 16:9 */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 -z-10 bg-primary/5 blur-2xl" />
              <div className="w-full aspect-video overflow-hidden shadow-2xl ring-1 ring-border">
                <img
                  src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop"
                  alt="Dashboard preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Credit Champions */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-2">
              <Trophy className="h-8 w-8" /> Carbon Credit Champions
            </h2>
            <p className="text-lg">Celebrating our top environmental heroes</p>
          </div>
          {topUsers.length >= 3 ? (
            <div className="flex justify-center items-end mb-16 gap-12 px-4">
              {/* Rank 2, 1, 3 */}
              <PodiumCard user={topUsers[1]} rank={2} />
              <PodiumCard user={topUsers[0]} rank={1} />
              <PodiumCard user={topUsers[2]} rank={3} />
            </div>
          ) : topUsers.length > 0 ? (
            <div className="flex justify-center items-end mb-16 gap-12 px-4">
              {topUsers[0] && <PodiumCard user={topUsers[0]} rank={1} />}
              {topUsers[1] && <PodiumCard user={topUsers[1]} rank={2} />}
            </div>
          ) : null}
        </div>

        {/* Complete Rankings */}
        <div className="mb-20">
          <Card>
            <CardHeader className="text-center py-8">
              <CardTitle className="text-3xl font-black flex items-center justify-center gap-3">
                <Trophy className="h-8 w-8" />
                Complete Rankings
                <Trophy className="h-8 w-8" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center font-black py-6">Rank</TableHead>
                    <TableHead className="font-black py-6">Username</TableHead>
                    <TableHead className="font-black py-6">Full Name</TableHead>
                    <TableHead className="text-center font-black py-6">Credits</TableHead>
                    <TableHead className="text-center font-black py-6">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.length > 0 ? (
                    topUsers.map((user, index) => (
                      <TableRow key={user._id}>
                        <TableCell className="text-center py-6">
                          <div className="flex items-center justify-center">
                            {index < 3 && <Crown className="h-5 w-5 mr-2" />}
                            <span className="font-black text-xl">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold py-6 text-lg">
                          {user.username || "—"}
                        </TableCell>
                        <TableCell className="font-semibold py-6">{user.fullName || "—"}</TableCell>
                        <TableCell className="text-center py-6">
                          <Badge>
                            {(user.carbonCredits ?? 0).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 3,
                            })}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <span className="font-black text-lg">
                            ₹
                            {(user.moneyEarned ?? 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16">
                        <Users className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg font-semibold">No data available yet</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-2">
              <Heart className="h-8 w-8 text-destructive" /> What Our Farmers Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Real stories from real farmers making a difference
            </p>
          </div>

          <div className="py-8 rounded-2xl border bg-gradient-to-r from-muted/50 to-muted/30">
            <Marquee pauseOnHover className="[--duration:40s]">
              {farmerReviews.map((review) => (
                <MarqueeReviewCard key={review.id} review={review} />
              ))}
            </Marquee>
          </div>

          <div className="text-center mt-8">
            <Card className="inline-block p-6 bg-gradient-to-r from-muted/50 to-muted/30">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-black text-primary mb-1">4.8/5</div>
                  <div className="flex justify-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Average Rating</p>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-2xl font-black text-primary mb-1">2,340+</div>
                  <p className="text-xs font-semibold text-muted-foreground">Happy Farmers</p>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-2xl font-black text-primary mb-1">₹15.6L</div>
                  <p className="text-xs font-semibold text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sentiment */}
        <Card className="mb-20">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-3xl font-black flex items-center justify-center gap-3">
              <Target className="h-8 w-8" />
              Live Sentiment Analysis
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Real-time farmer satisfaction metrics across our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-2xl border">
                <Smile className="h-12 w-12 mx-auto mb-4 text-primary" />
                <div className="text-4xl font-black mb-4">{sentiment.positive}%</div>
                <Progress value={sentiment.positive} className="mb-4 h-3" />
                <p className="text-sm font-bold uppercase tracking-wide">Positive Feedback</p>
              </div>
              <div className="text-center p-6 rounded-2xl border">
                <Meh className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <div className="text-4xl font-black mb-4">{sentiment.neutral}%</div>
                <Progress value={sentiment.neutral} className="mb-4 h-3" />
                <p className="text-sm font-bold uppercase tracking-wide">Neutral Feedback</p>
              </div>
              <div className="text-center p-6 rounded-2xl border">
                <Frown className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <div className="text-4xl font-black mb-4">{sentiment.negative}%</div>
                <Progress value={sentiment.negative} className="mb-4 h-3" />
                <p className="text-sm font-bold uppercase tracking-wide">Areas for Improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Dashboard */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-2">
              <Award className="h-8 w-8" /> Impact Dashboard
            </h2>
            <p className="text-lg">Measuring our collective environmental impact in real-time</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
              icon={Leaf}
              label="Total Carbon Saved"
              value={stats.totalCarbon}
              suffix=" tons"
            />
            <StatCard icon={Award} label="Carbon Credits Issued" value={stats.totalCredits} />
            <StatCard icon={Users} label="Active Farmers" value={stats.activeFarmers} />
            <StatCard
              icon={IndianRupee}
              label="Money Distributed"
              value={"₹" + (stats.moneyDistributed / 100000).toFixed(1)}
              suffix="L"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="py-16 text-center">
          <div className="rounded-3xl p-12 border">
            <div className="flex justify-center mb-6">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-bold mb-2">
              &copy; {new Date().getFullYear()} NABARD H2S Platform
            </p>
            <p className="font-medium">
              Empowering farmers, protecting our planet, one credit at a time.
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <Badge className="flex items-center gap-1">
                <Leaf className="h-4 w-4" /> Carbon Negative
              </Badge>
              <Badge className="flex items-center gap-1">
                <Trophy className="h-4 w-4" /> Award Winning
              </Badge>
              <Badge className="flex items-center gap-1">
                <Zap className="h-4 w-4" /> Real-time Verified
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
