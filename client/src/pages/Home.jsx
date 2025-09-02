import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Award as AwardIcon,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

export default function Home() {
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
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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
        "https://images.unsplash.com/photo-1494790108755-2616c88275b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
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

  // PodiumCard - top 3 visuals
  const PodiumCard = ({ user, rank }) => {
    if (!user) return null;

    const podiumHeights = ["h-36", "h-28", "h-32"];
    const medals = [
      { label: "Gold", bg: "bg-yellow-500", ring: "ring-yellow-300", Icon: Crown },
      { label: "Silver", bg: "bg-slate-400", ring: "ring-slate-300", Icon: Medal },
      { label: "Bronze", bg: "bg-amber-500", ring: "ring-amber-300", Icon: AwardIcon },
    ];
    const medal = medals[rank - 1] || medals[2];
    const Icon = medal.Icon;

    return (
      <div className="relative flex flex-col items-center">
        <div
          className={`${podiumHeights[rank - 1] ?? "h-28"} w-32 rounded-t-3xl flex items-end justify-center pb-3 mb-4 border shadow-md`}
          style={{
            background:
              rank === 1
                ? "linear-gradient(180deg,#fff7ed,#fff2cc)"
                : rank === 2
                ? "linear-gradient(180deg,#f8fafc,#eef2ff)"
                : "linear-gradient(180deg,#fff7ed,#fff3e0)",
          }}
        >
          <div className="relative z-10 font-black text-2xl flex items-center gap-2">
            <span className="text-primary-foreground">{rank}</span>
            <Badge
              className={`${rank === 1 ? "bg-yellow-500 text-black" : rank === 2 ? "bg-slate-400 text-black" : "bg-amber-500 text-white"} px-2 py-1 rounded-full text-xs`}
            >
              {medal.label}
            </Badge>
          </div>
        </div>

        <Card className="w-44">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-3">
              <div className={`p-3 rounded-full ${medal.bg} ${medal.ring ? "ring-2 " + medal.ring : ""}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-lg truncate">{user.username || "—"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.fullName || "—"}</p>

              <div className="space-y-2 pt-2 border-t mt-2">
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

  // Simple marquee implementation using CSS
const Marquee = ({ children, className = "" }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="flex animate-marquee">
      <div className="flex space-x-6">{children}</div>
      <div className="flex space-x-6">{children}</div>
    </div>

    <style jsx>{`
      @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee {
        animation: marquee 40s linear infinite;
        width: max-content;
      }
      .animate-marquee:hover {
        animation-play-state: paused;
      }
    `}</style>
  </div>
);


  return (
    <div className="min-h-screen bg-background">
      {/* Add custom CSS for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%) }
          100% { transform: translateX(-50%) }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HERO SECTION - Full viewport height */}
        {/* HERO SECTION - Full viewport height */}
        <div className="relative h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-green-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-emerald-400/10 via-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 h-full flex items-center">
            {/* ✅ Removed max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 */}
            <div className="w-full h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
                
                {/* Left side - Content */}
                <div className="space-y-8 text-center lg:text-left px-6 lg:px-12">
                  {/* Logo Badge */}
                  <div className="inline-flex items-center px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                    <Leaf className="h-6 w-6 text-emerald-400 mr-2" />
                    <span className="text-emerald-400 font-semibold">Carbon Credit Revolution</span>
                  </div>
                  
                  {/* Main Heading with 3D effect */}
                  <div className="space-y-4">
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-none">
                      <span className="block text-white drop-shadow-2xl">Kisaan</span>
                      <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-pulse">
                        Credit
                      </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                      Transform your farming into a{" "}
                      <span className="text-emerald-400 font-bold">sustainable goldmine</span>
                      {" "}with verified carbon credits
                    </p>
                  </div>
                  
                  {/* CTA Buttons with glassmorphism */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button 
                      size="lg" 
                      className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-6 text-lg font-bold rounded-2xl shadow-2xl border-0 transform transition-all duration-300 hover:scale-105"
                      onClick={() => navigate?.("/dashboard-project/create-project")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <TreePine className="h-6 w-6 mr-3" />
                      Start Your Project
                      <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="group relative overflow-hidden bg-white/10 border-2 border-white/30 text-white hover:bg-white hover:text-slate-900 px-8 py-6 text-lg font-bold rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-105"
                      onClick={() => navigate?.("/estimate-earnings")}
                    >
                      <IndianRupee className="h-6 w-6 mr-3" />
                      Calculate Earnings
                    </Button>
                  </div>
                  
                  {/* Trust indicators */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-4">
                    <div className="flex items-center px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-green-300 text-sm font-medium">Live Verification</span>
                    </div>
                    <div className="flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                      <Trophy className="h-4 w-4 text-blue-300 mr-2" />
                      <span className="text-blue-300 text-sm font-medium">₹15.6L+ Distributed</span>
                    </div>
                    <div className="flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                      <Users className="h-4 w-4 text-purple-300 mr-2" />
                      <span className="text-purple-300 text-sm font-medium">2340+ Farmers</span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Full height visual */}
                <div className="relative lg:pl-12 h-full px-6 lg:px-12">
                  <div className="relative h-full min-h-[600px] lg:min-h-[700px]">
                    {/* Main image container with 3D effects - full height */}
                    <div className="relative group h-full">
                      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-green-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 h-full">
                        <img
                          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                          alt="Modern sustainable farming"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        {/* Floating stats cards */}
                        <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                          <div className="text-emerald-400 text-2xl font-bold">₹87,500</div>
                          <div className="text-white text-sm">Monthly Earnings</div>
                        </div>
                        
                        <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                          <div className="text-green-400 text-2xl font-bold">1,250</div>
                          <div className="text-white text-sm">Carbon Credits</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className="absolute -top-8 -left-8 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl animate-bounce delay-300"></div>
                    <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-green-400/20 rounded-full blur-xl animate-bounce delay-700"></div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
          
          {/* Enhanced scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex flex-col items-center space-y-2 animate-bounce">
              <span className="text-white/70 text-xs uppercase tracking-wider">Scroll Down</span>
              <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center bg-white/5 backdrop-blur-sm">
                <div className="w-1 h-3 bg-emerald-400 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>


        {/* Carbon Credit Champions (Podium: top 3) */}
        <div className="mb-20 pt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" /> KisaanCredit Champions
            </h2>
            <p className="text-lg">Celebrating our top environmental heroes</p>
          </div>

          {/* Podium: show only when we have at least one user */}
          {topUsers.length > 0 && (
            <div className="flex justify-center items-end mb-16 gap-12 px-4">
              {topUsers[1] && <PodiumCard user={topUsers[1]} rank={2} />}
              {topUsers[0] && <PodiumCard user={topUsers[0]} rank={1} />}
              {topUsers[2] && <PodiumCard user={topUsers[2]} rank={3} />}
            </div>
          )}
        </div>

        {/* Complete Rankings table */}
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
            <Marquee className="[--duration:40s]">
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
            <StatCard icon={AwardIcon} label="Carbon Credits Issued" value={stats.totalCredits} />
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
              &copy; {new Date().getFullYear()} KisaanCredit Platform
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