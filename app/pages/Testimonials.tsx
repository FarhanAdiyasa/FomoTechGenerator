export default function Testimonials() {
  const testimonials = [
    {
      name: "John Doe",
      feedback:
        "“It told me I’m 3 frameworks behind. I cried, then I fixed it.”",
    },
    {
      name: "Jane Smith",
      feedback: "“Best reality check for developers! Also, funny.”",
    },
    {
      name: "Alex Lee",
      feedback:
        "“I was fine until it roasted my ‘vanilla JS forever’ mindset.”",
    },
  ];

  return (
    <section id="testimonials" className="py-16 bg-white">
      <h2 className="text-4xl font-bold text-center mb-8 text-purple-600">
        What Users Say
      </h2>
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="p-6 bg-gray-100 rounded-lg shadow hover:scale-105 transition-transform"
          >
            <p className="italic text-gray-700 mb-4">
              "{testimonial.feedback}"
            </p>
            <p className="font-semibold text-blue-600 text-right">
              - {testimonial.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
