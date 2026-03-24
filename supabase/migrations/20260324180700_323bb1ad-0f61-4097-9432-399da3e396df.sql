-- Fix conversations policies: restrict to authenticated role
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations FOR SELECT TO authenticated
USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;
CREATE POLICY "Users can update conversations they participate in"
ON public.conversations FOR UPDATE TO authenticated
USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

-- Fix messages policies: restrict to authenticated role
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())));

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = sender_id) AND EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())));

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id);