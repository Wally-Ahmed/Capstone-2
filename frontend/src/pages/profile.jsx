import {
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import { Footer } from "@/widgets/layout";

export function Profile() {
  return (
    <>
      <div className="relative flex h-[300px] content-center items-center justify-center pt-16 pb-32">
        <div className="absolute top-0 h-full w-full bg-black bg-cover bg-center" />
        <section className="absolute top-0 h-[300px] w-full bg-[url('/img/background-3.png')] bg-cover bg-center" />
      </div>

      <section className="relative bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <Card className="shadow-lg border shadow-gray-500/10 rounded-lg">
              <CardHeader floated={false} className="relative h-56">
                <img
                  alt="Card Image"
                  src="/img/team-1.jpg"
                  className="h-full w-full object-cover"
                />
              </CardHeader>
              <CardBody>
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="mb-3 mt-2 font-bold"
                >
                  Auto-Assign Shifts with Smart Scheduling AI
                </Typography>
                <Typography className="font-normal text-blue-gray-500">
                  Let intelligent algorithms handle shift assignments, balancing workload, preferences, and availability for optimal team performance.
                </Typography>
              </CardBody>
            </Card>

            {/* Card 2 */}
            <Card className="shadow-lg border shadow-gray-500/10 rounded-lg">
              <CardHeader floated={false} className="relative h-56">
                <img
                  alt="Card Image"
                  src="/img/team-2.jpg"
                  className="h-full w-full object-cover"
                />
              </CardHeader>
              <CardBody>
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="mb-3 mt-2 font-bold"
                >
                  Real-Time Shift Swaps and Notifications
                </Typography>
                <Typography className="font-normal text-blue-gray-500">
                  Enable seamless shift swaps and updates with instant notifications, keeping everyone connected and up-to-date.
                </Typography>
              </CardBody>
            </Card>

            {/* Card 3 */}
            <Card className="shadow-lg border shadow-gray-500/10 rounded-lg">
              <CardHeader floated={false} className="relative h-56">
                <img
                  alt="Card Image"
                  src="/img/team-3.jpg"
                  className="h-full w-full object-cover"
                />
              </CardHeader>
              <CardBody>
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="mb-3 mt-2 font-bold"
                >
                  Flexible Scheduling and Overtime Tracking
                </Typography>
                <Typography className="font-normal text-blue-gray-500">
                  Easily manage flexible hours, monitor overtime, and ensure compliance, all while keeping scheduling transparent and fair for your team.
                </Typography>
              </CardBody>
            </Card>

            {/* Card 4 */}
            <Card className="shadow-lg border shadow-gray-500/10 rounded-lg">
              <CardHeader floated={false} className="relative h-56">
                <img
                  alt="Card Image"
                  src="/img/team-4.png"
                  className="h-full w-full object-cover"
                />
              </CardHeader>
              <CardBody>
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="mb-3 mt-2 font-bold"
                >
                  Effortless Time-Off Management
                </Typography>
                <Typography className="font-normal text-blue-gray-500">
                  Simplify requests and approvals for time off, ensuring smooth coverage and reducing scheduling conflicts.
                </Typography>
              </CardBody>
            </Card>

            {/* Card 5 */}
            <Card className="shadow-lg border shadow-gray-500/10 rounded-lg">
              <CardHeader floated={false} className="relative h-56">
                <img
                  alt="Card Image"
                  src="/img/teamwork-1.png"
                  className="h-full w-full object-cover"
                />
              </CardHeader>
              <CardBody>
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="mb-3 mt-2 font-bold"
                >
                  Data-Driven Insights for Smarter Scheduling
                </Typography>
                <Typography className="font-normal text-blue-gray-500">
                  Gain insights into team productivity and optimize schedules based on real-time analytics and shift performance data.
                </Typography>
              </CardBody>
            </Card>

            {/* Card 6 */}
            <Card className="shadow-lg border shadow-gray-500/10 rounded-lg">
              <CardHeader floated={false} className="relative h-56">
                <img
                  alt="Card Image"
                  src="/img/teamwork-2.jpg"
                  className="h-full w-full object-cover"
                />
              </CardHeader>
              <CardBody>
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="mb-3 mt-2 font-bold"
                >
                  Integrated Team Communication Hub
                </Typography>
                <Typography className="font-normal text-blue-gray-500">
                  Keep everyone on the same page with in-app messaging and notifications, making last-minute changes hassle-free.
                </Typography>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
      <div className="bg-white">
        <Footer />
      </div>
    </>
  );
}

export default Profile;
