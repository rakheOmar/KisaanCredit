import { useEffect, useState } from "react";
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
  Award as AwardIcon,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const [topUsers, setTopUsers] = useState([]);
  const [stats, setStats] = useState({
    totalCarbon: 2350,
    totalCredits: 456,
    activeFarmers: 251,
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
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review:
        "इस प्लेटफॉर्म ने मेरी खेती का जीवन बदल दिया! पिछले साल कार्बन क्रेडिट से ₹85,000 कमाए।",
      rating: 5,
      creditsEarned: 125,
      cropType: "जैविक धान",
    },
    {
      id: 2,
      name: "Priya Sharma",
      location: "Punjab",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review: "बहुत अच्छी सपोर्ट टीम और पारदर्शी प्रक्रिया। अब मेरी टिकाऊ खेती लाभदायक है!",
      rating: 5,
      creditsEarned: 98,
      cropType: "गेहूं",
    },
    {
      id: 3,
      name: "Suresh Patel",
      location: "Gujarat",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review:
        "उपयोग में आसान प्लेटफॉर्म और रियल-टाइम ट्रैकिंग। हम जैसे आधुनिक किसानों के लिए बिल्कुल सही।",
      rating: 4,
      creditsEarned: 75,
      cropType: "कपास",
    },
    {
      id: 4,
      name: "Rakesh Joshi",
      location: "Rajasthan",
      image:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review: "सत्यापन प्रक्रिया आसान है और भुगतान हमेशा समय पर होता है। बहुत सिफारिश करूंगी!",
      rating: 5,
      creditsEarned: 110,
      cropType: "बाजरा",
    },
    {
      id: 5,
      name: "Amit Singh",
      location: "Uttar Pradesh",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review: "टिकाऊ खेती के लिए शानदार पहल। इस साल मेरी आय में 40% की वृद्धि हुई!",
      rating: 5,
      creditsEarned: 89,
      cropType: "गन्ना",
    },
    {
      id: 6,
      name: "Kavita Reddy",
      location: "Karnataka",
      image:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review:
        "किसानों के लिए टेक्नोलॉजी को सरल बनाया गया। मोबाइल ऐप और तत्काल सूचनाएं बहुत पसंद हैं।",
      rating: 4,
      creditsEarned: 65,
      cropType: "कॉफी",
    },
    {
      id: 7,
      name: "Vikram Choudhary",
      location: "Haryana",
      image:
        "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review: "मेरे खेत के लिए सबसे अच्छा निर्णय। कार्बन क्रेडिट कृषि का भविष्य है!",
      rating: 5,
      creditsEarned: 132,
      cropType: "सरसों",
    },
    {
      id: 8,
      name: "Sunita Yadav",
      location: "Madhya Pradesh",
      image:
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=60&crop=faces",
      review: "सरल पंजीकरण प्रक्रिया और उत्कृष्ट ग्राहक सेवा। बहुत संतुष्ट हूं!",
      rating: 5,
      creditsEarned: 92,
      cropType: "सोयाबीन",
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
        totalCarbon: prev.totalCarbon + 0,
        totalCredits: prev.totalCredits + 0,
        activeFarmers: prev.activeFarmers + 0,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const PodiumCard = ({ user, rank }) => {
    if (!user) return null;

    const podiumData = [
      {
        height: "h-36",
        label: "Gold",
        bg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
        podiumBg: "bg-gradient-to-t from-yellow-400/30 to-yellow-200/20",
        ring: "ring-yellow-500/30",
        Icon: Crown,
        textColor: "text-yellow-900",
        borderColor: "border-yellow-400/50",
      },
      {
        height: "h-28",
        label: "Silver",
        bg: "bg-gradient-to-br from-gray-300 to-gray-500",
        podiumBg: "bg-gradient-to-t from-gray-400/30 to-gray-200/20",
        ring: "ring-gray-400/30",
        Icon: Medal,
        textColor: "text-gray-900",
        borderColor: "border-gray-400/50",
      },
      {
        height: "h-32",
        label: "Bronze",
        bg: "bg-gradient-to-br from-orange-400 to-orange-600",
        podiumBg: "bg-gradient-to-t from-orange-400/30 to-orange-200/20",
        ring: "ring-orange-500/30",
        Icon: AwardIcon,
        textColor: "text-orange-900",
        borderColor: "border-orange-400/50",
      },
    ];

    const podium = podiumData[rank - 1] || podiumData[2];
    const Icon = podium.Icon;

    return (
      <div className="relative flex flex-col items-center">
        <div
          className={`${podium.height} w-32 rounded-t-3xl flex items-end justify-center pb-3 mb-4 border-2 shadow-lg ${podium.podiumBg} ${podium.borderColor}`}
        >
          <div className="relative z-10 font-black text-2xl flex items-center gap-2">
            <span className="text-foreground">{rank}</span>
            <Badge
              className={`${podium.bg} ${podium.textColor} px-2 py-1 rounded-full text-xs font-bold shadow-md`}
            >
              {podium.label}
            </Badge>
          </div>
        </div>

        <Card className="w-44 shadow-xl">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-3">
              <div
                className={`p-3 rounded-full ${podium.bg} ${podium.ring ? "ring-2 " + podium.ring : ""} shadow-lg`}
              >
                <Icon className={`h-6 w-6 ${podium.textColor}`} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-lg truncate">{user.username || "—"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.fullName || "—"}</p>

              <div className="space-y-2 pt-2 border-t mt-2">
                <div className="flex items-center justify-center space-x-1">
                  <Sparkles className="h-3 w-3 text-foreground" />
                  <span className="text-sm font-bold">
                    {(user.carbonCredits ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    })}{" "}
                    Credits
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <IndianRupee className="h-3 w-3 text-foreground" />
                  <span className="text-sm font-semibold">
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
    <Card className="mx-4 w-80 h-80 flex-shrink-0 hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-muted/50 to-background border">
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
                    className={`h-4 w-4 ${i < review.rating ? "text-primary fill-current" : "text-muted-foreground"}`}
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
          <Quote className="h-4 w-4 text-foreground absolute -top-1 -left-1" />
          <p className="text-sm text-muted-foreground italic pl-6 leading-relaxed line-clamp-4">
            {review.review}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t mt-auto">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-foreground" />
            <span className="text-sm font-semibold">{review.creditsEarned} Credits</span>
          </div>
          <Badge className="text-xs px-3 py-1">Verified</Badge>
        </div>
      </CardContent>
    </Card>
  );

  const Marquee = ({ children, className = "" }) => (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex animate-marquee">
        <div className="flex space-x-6">{children}</div>
        <div className="flex space-x-6">{children}</div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
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
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="relative h-screen overflow-hidden bg-background">
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
              {/* Left Content */}
              <div className="space-y-8 text-center lg:text-left px-6 lg:px-12 order-2 lg:order-1">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
                  <Leaf className="h-6 w-6 text-primary mr-2" />
                  <span className="text-primary font-semibold">Carbon Credit Revolution</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-none">
                    <span className="block text-foreground">Kisaan</span>
                    <span className="block text-primary">Credit</span>
                  </h1>

                  <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    Transform your farming into a{" "}
                    <span className="text-primary font-bold">sustainable goldmine</span> with
                    verified carbon credits
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="group relative overflow-hidden px-8 py-6 text-lg font-bold rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                    onClick={() => navigate?.("/dashboard-project/create-project")}
                  >
                    <TreePine className="h-6 w-6 mr-3" />
                    Start Your Project
                    <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="group relative overflow-hidden px-8 py-6 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105"
                    onClick={() => navigate?.("/estimate-earnings")}
                  >
                    <IndianRupee className="h-6 w-6 mr-3" />
                    Calculate Earnings
                  </Button>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-4">
                  <div className="flex items-center px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                    <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                    <span className="text-primary text-sm font-medium">Live Verification</span>
                  </div>
                  <div className="flex items-center px-4 py-2 rounded-full bg-green-100 border border-green-300">
                    <Trophy className="h-4 w-4 text-green-700 mr-2" />
                    <span className="text-green-700 text-sm font-medium">₹2.5L+ Distributed</span>
                  </div>

                  <div className="flex items-center px-4 py-2 rounded-full bg-muted/20 border border-muted-foreground/30">
                    <Users className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground text-sm font-medium">250+ Farmers</span>
                  </div>
                </div>
              </div>

              {/* Right Image - Made Bigger */}
              <div className="relative h-full px-6 lg:px-12 flex items-center justify-center order-1 lg:order-2">
                <div className="relative w-full max-w-2xl">
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-3xl border bg-background shadow-2xl w-full h-96 lg:h-[500px]">
                      <img
                        src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                        alt="Modern sustainable farming"
                        className="w-full h-full object-cover"
                      />

                      {/* Floating stats cards */}
                      <div className="absolute top-6 left-6 bg-background/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Carbon Saved
                            </p>
                            <p className="font-bold text-lg">{stats.totalCarbon}+ tons</p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Total Earnings
                            </p>
                            <p className="font-bold text-lg">₹2.5L+</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the content with improved spacing */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Champions Section */}
        <div className="mb-24 pt-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-primary" /> KisaanCredit Champions
            </h2>
            <p className="text-lg text-muted-foreground">
              Celebrating our top environmental heroes
            </p>
          </div>

          {topUsers.length > 0 && (
            <div className="flex justify-center items-end mb-16 gap-8 lg:gap-12 px-4">
              {topUsers[1] && <PodiumCard user={topUsers[1]} rank={2} />}
              {topUsers[0] && <PodiumCard user={topUsers[0]} rank={1} />}
              {topUsers[2] && <PodiumCard user={topUsers[2]} rank={3} />}
            </div>
          )}
        </div>

        {/* Rankings Table */}
        <div className="mb-24">
          <Card>
            <CardHeader className="text-center py-8">
              <CardTitle className="text-3xl font-black flex items-center justify-center gap-3">
                <Trophy className="h-8 w-8" />
                Monthly Rankings
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
                            {index < 3 && <Crown className="h-5 w-5 mr-2 text-primary" />}
                            <span className="font-black text-xl">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold py-6 text-lg">
                          {user.username || "—"}
                        </TableCell>
                        <TableCell className="font-semibold py-6">{user.fullName || "—"}</TableCell>
                        <TableCell className="text-center py-6">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
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
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-semibold">No data available yet</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Farmer Reviews Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-2">
              <Heart className="h-8 w-8 text-primary" /> What Our Farmers Say
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

          <div className="text-center mt-12">
            <Card className="inline-block p-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-black text-foreground mb-2">4.8/5</div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-primary fill-current" />
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Average Rating</p>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-3xl font-black text-foreground mb-2">250+</div>
                  <p className="text-sm font-semibold text-muted-foreground">Happy Farmers</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <Card className="mb-24">
          <CardHeader className="text-center py-12">
            <CardTitle className="text-4xl font-black flex items-center justify-center gap-3 mb-4">
              <Target className="h-10 w-10 text-primary" />
              Live Sentiment Analysis
            </CardTitle>
            <CardDescription className="text-lg">
              Real-time farmer satisfaction metrics across our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-3xl border bg-gradient-to-br from-primary/5 to-primary/10">
                <Smile className="h-16 w-16 mx-auto mb-6 text-primary" />
                <div className="text-5xl font-black mb-6 text-primary">{sentiment.positive}%</div>
                <Progress value={sentiment.positive} className="mb-6 h-4" />
                <p className="text-sm font-bold uppercase tracking-wide text-primary">
                  Positive Feedback
                </p>
              </div>
              <div className="text-center p-8 rounded-3xl border">
                <Meh className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                <div className="text-5xl font-black mb-6">{sentiment.neutral}%</div>
                <Progress value={sentiment.neutral} className="mb-6 h-4" />
                <p className="text-sm font-bold uppercase tracking-wide">Neutral Feedback</p>
              </div>
              <div className="text-center p-8 rounded-3xl border">
                <Frown className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                <div className="text-5xl font-black mb-6">{sentiment.negative}%</div>
                <Progress value={sentiment.negative} className="mb-6 h-4" />
                <p className="text-sm font-bold uppercase tracking-wide">Areas for Improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Dashboard */}
        <div className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
              <Award className="h-10 w-10 text-primary" /> Impact Dashboard
            </h2>
            <p className="text-lg text-muted-foreground">
              Measuring our collective environmental impact in real-time
            </p>
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
            <StatCard icon={IndianRupee} label="Money Distributed" value="2.5L" suffix="+" />
          </div>
        </div>

        {/* Footer */}
        <footer className="py-20 text-center">
          <div className="rounded-3xl p-16 border bg-gradient-to-br from-muted/50 to-background">
            <div className="flex justify-center mb-8">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <Leaf className="h-12 w-12 text-primary" />
              </div>
            </div>
            <p className="text-xl font-bold mb-3">
              &copy; {new Date().getFullYear()} KisaanCredit Platform
            </p>
            <p className="font-medium text-muted-foreground mb-8">
              Empowering farmers, protecting our planet, one credit at a time.
            </p>
            <div className="flex justify-center gap-6 mt-8">
              <Badge className="flex items-center gap-2 px-4 py-2">
                <Leaf className="h-4 w-4" /> Carbon Negative
              </Badge>
              <Badge className="flex items-center gap-2 px-4 py-2">
                <Trophy className="h-4 w-4" /> Award Winning
              </Badge>
              <Badge className="flex items-center gap-2 px-4 py-2">
                <Zap className="h-4 w-4" /> Real-time Verified
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
