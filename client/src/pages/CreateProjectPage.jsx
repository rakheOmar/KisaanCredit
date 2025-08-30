import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast, Toaster } from "sonner";
import axiosInstance from "@/lib/axios";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

const projectFormSchema = z.object({
  projectName: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  projectType: z.enum(["Agroforestry", "Rice Cultivation Methane Reduction", "Mixed"]),
  locationState: z.string().min(2, { message: "State is required." }),
  locationDistrict: z.string().min(2, { message: "District is required." }),
  geoJson: z.string().optional(),
  carbonStandard: z.enum(["Verra", "Gold Standard", "Other"]).optional(),
  methodology: z.string().min(3, { message: "Methodology is required." }),
  creditingPeriodStart: z.date({ required_error: "A start date is required." }),
  creditingPeriodEnd: z.date({ required_error: "An end date is required." }),
});

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: "",
      projectType: "Agroforestry",
      locationState: "",
      locationDistrict: "",
      geoJson: "",
      carbonStandard: "Verra",
      methodology: "",
      creditingPeriodStart: new Date(),
      creditingPeriodEnd: new Date(),
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        projectName: values.projectName,
        projectType: values.projectType,
        carbonStandard: values.carbonStandard,
        methodology: values.methodology,
        location: {
          state: values.locationState,
          district: values.locationDistrict,
          geoJson: values.geoJson ? JSON.parse(values.geoJson) : undefined,
        },
        creditingPeriod: {
          startDate: values.creditingPeriodStart.toISOString(),
          endDate: values.creditingPeriodEnd.toISOString(),
        },
      };

      const response = await axiosInstance.post("/projects", payload);
      toast.success("Project created successfully!");
      navigate(`/dashboard/project/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project.");
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" richColors />
      <Card className="mt-10 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Agroforestry">Agroforestry</SelectItem>
                          <SelectItem value="Rice Cultivation Methane Reduction">
                            Rice Cultivation Methane Reduction
                          </SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="locationState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., West Bengal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationDistrict"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., South 24 Parganas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="geoJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GeoJSON (optional)</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full rounded-md border p-2 text-sm"
                        placeholder='{"type": "Polygon", "coordinates": [[[...]]]}'
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carbonStandard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbon Standard</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select carbon standard" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Verra">Verra</SelectItem>
                          <SelectItem value="Gold Standard">Gold Standard</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="methodology"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Methodology</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter methodology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="creditingPeriodStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crediting Period Start</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? field.value.toDateString() : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditingPeriodEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crediting Period End</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? field.value.toDateString() : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full">
                Create Project
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
