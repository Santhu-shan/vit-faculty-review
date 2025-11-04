import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string;
  };
  answers: {
    id: string;
    content: string;
    created_at: string;
    profiles: {
      display_name: string;
    };
  }[];
}

export const AskQuestion = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "" });
  const [answerContent, setAnswerContent] = useState<{ [key: string]: string }>({});
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchQuestions();

    return () => subscription.unsubscribe();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select(`
        *,
        profiles:user_id(display_name),
        answers(
          *,
          profiles:user_id(display_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching questions:", error);
      return;
    }

    setQuestions(data as any || []);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error("Please sign in to ask a question");
      navigate("/auth");
      return;
    }

    if (!newQuestion.title || !newQuestion.content) {
      toast.error("Please fill in both title and content");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("questions")
      .insert({
        title: newQuestion.title,
        content: newQuestion.content,
        user_id: session.user.id,
      });

    if (error) {
      toast.error("Failed to post question");
      console.error(error);
    } else {
      toast.success("Question posted successfully!");
      setNewQuestion({ title: "", content: "" });
      fetchQuestions();
    }

    setLoading(false);
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!session) {
      toast.error("Please sign in to answer");
      navigate("/auth");
      return;
    }

    const content = answerContent[questionId];
    if (!content) {
      toast.error("Please enter an answer");
      return;
    }

    const { error } = await supabase
      .from("answers")
      .insert({
        question_id: questionId,
        content,
        user_id: session.user.id,
      });

    if (error) {
      toast.error("Failed to post answer");
      console.error(error);
    } else {
      toast.success("Answer posted successfully!");
      setAnswerContent({ ...answerContent, [questionId]: "" });
      fetchQuestions();
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-6 shadow-elegant">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Ask a Question
        </h2>
        <form onSubmit={handleSubmitQuestion} className="space-y-4">
          <Input
            placeholder="Question title"
            value={newQuestion.title}
            onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
            disabled={!session}
            className="text-base"
          />
          <Textarea
            placeholder="Describe your question about faculty..."
            value={newQuestion.content}
            onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
            disabled={!session}
            rows={4}
          />
          <Button type="submit" disabled={loading || !session} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Post Question
          </Button>
          {!session && (
            <p className="text-sm text-muted-foreground">
              Please <a href="/auth" className="text-primary underline">sign in</a> to ask questions
            </p>
          )}
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Questions</h3>
        {questions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground shadow-soft">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No questions yet. Be the first to ask!</p>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="p-6 shadow-soft hover:shadow-medium transition-all">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-1">{question.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Asked by {question.profiles?.display_name || "Anonymous"} •{" "}
                    {new Date(question.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-foreground">{question.content}</p>

                <div className="border-t pt-4 space-y-4">
                  <h5 className="font-semibold text-sm text-muted-foreground">
                    {question.answers?.length || 0} Answer(s)
                  </h5>
                  
                  {question.answers?.map((answer) => (
                    <div key={answer.id} className="bg-muted/30 p-4 rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        {answer.profiles?.display_name || "Anonymous"} •{" "}
                        {new Date(answer.created_at).toLocaleDateString()}
                      </p>
                      <p>{answer.content}</p>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write your answer..."
                      value={answerContent[question.id] || ""}
                      onChange={(e) =>
                        setAnswerContent({ ...answerContent, [question.id]: e.target.value })
                      }
                      disabled={!session}
                      rows={3}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSubmitAnswer(question.id)}
                      disabled={!session || !answerContent[question.id]}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {!session && (
                    <p className="text-sm text-muted-foreground">
                      Please <a href="/auth" className="text-primary underline">sign in</a> to answer
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
