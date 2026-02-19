import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PenTool, LayoutTemplate, MonitorPlay, Layers } from "lucide-react";

// Define the shape based on your FastAPI schema
interface ServiceItem {
    id: number | string;
    name: string;
    description: string;
    base_price: number;
    images?: string[]; // Updated to match backend schema
}

// Fetch the services dynamically from your backend
async function getServices(): Promise<ServiceItem[]> {
    try {
        // Adjust this endpoint based on how your FastAPI backend filters products vs services
        // Example: /products?type=service OR /services
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?type=service`, {
            next: { revalidate: 3600 } // Revalidate cache every hour
        });

        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Failed to fetch services:", error);
        return [];
    }
}

export default async function ServicesCatalogPage() {
    const services = await getServices();

    // A helper function to assign random icons to dynamic services if no image is provided
    const getIconForIndex = (index: number) => {
        const icons = [
            <PenTool key="1" className="h-10 w-10 mb-4 text-black" />,
            <LayoutTemplate key="2" className="h-10 w-10 mb-4 text-black" />,
            <MonitorPlay key="3" className="h-10 w-10 mb-4 text-black" />,
            <Layers key="4" className="h-10 w-10 mb-4 text-black" />
        ];
        return icons[index % icons.length];
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Page Header */}
                <div className="space-y-4 max-w-2xl">
                    <h1 className="text-5xl font-black tracking-tighter uppercase text-black">
                        Professional <span className="text-zinc-400">Services</span>
                    </h1>
                    <p className="text-xl text-zinc-600">
                        Need help before we hit print? Book our specialized services including pre-press formatting, custom structural design, and 3D mockups.
                    </p>
                </div>

                {services.length === 0 ? (
                    <div className="border-2 border-dashed border-black p-12 text-center bg-zinc-50">
                        <h3 className="text-xl font-bold">No services available right now</h3>
                        <p className="text-zinc-500">Please check back later or contact support.</p>
                    </div>
                ) : (
                    /* Services Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <Card
                                key={service.id}
                                className="flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-white rounded-md"
                            >
                                <CardHeader>
                                    {/* Show image if exists in DB, otherwise show a dynamic icon */}
                                    {service.images && service.images.length > 0 ? (
                                        <div className="w-full h-48 border-2 border-black mb-4 overflow-hidden bg-zinc-100 rounded-md">
                                            <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        getIconForIndex(index)
                                    )}

                                    <CardTitle className="text-2xl font-bold uppercase">{service.name}</CardTitle>
                                    <CardDescription className="text-base text-zinc-600 line-clamp-3">
                                        {service.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-grow">
                                    <div className="inline-block bg-zinc-100 px-3 py-1 border-2 border-black text-sm font-bold mt-2 rounded-md">
                                        Starts at ₹{service.base_price.toLocaleString()}
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className="w-full bg-black text-white hover:bg-zinc-800 text-lg h-12 rounded-md border-2 border-black"
                                        asChild
                                    >
                                        {/* Routes to the dynamic detail page where they can fill out the JSON schema form */}
                                        <Link href={`/services/${service.id}`}>
                                            Configure Request <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}