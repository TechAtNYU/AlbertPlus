import { redirect } from "next/navigation";

const HomePage = () => {
  // TODO: homepage is not ready yet, hide if from MVP for now
  redirect("/dashboard/register");
};

export default HomePage;
