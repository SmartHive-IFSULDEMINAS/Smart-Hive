from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthLoginTests(APITestCase):
	def setUp(self):
		self.password = 'SenhaForte123!'
		self.superuser = User.objects.create_superuser(
			username='admin',
			email='admin@smarthive.local',
			password=self.password,
		)

	def test_superuser_can_login_with_username(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': 'admin', 'password': self.password},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('access', response.data)
		self.assertIn('refresh', response.data)
		self.assertEqual(response.data['user']['username'], 'admin')

	def test_superuser_can_login_with_email_and_whitespace(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': '  admin@smarthive.local  ', 'password': self.password},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('access', response.data)
		self.assertEqual(response.data['user']['username'], 'admin')

	def test_login_with_invalid_password_returns_401(self):
		response = self.client.post(
			'/api/auth/login/',
			{'username': 'admin', 'password': 'senha_errada'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
