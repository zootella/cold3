<script setup>

definePageMeta({layout: 'feed-layout', note: 'on page2feed'})

let dynamicValue = ref('dynamic value') // This makes dynamicValue a reactive reference
let staticValue = 'static value' // This remains a non-reactive constant
//and the third one, below, is just regular html

</script>
<template>

<NavigationBar note="on page2" />
<SnippetComponent
	:dynamicProperty="dynamicValue"
	:staticProperty="staticValue"
	regularProperty="regular value"
/>

<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
<li>Item 4</li>
<li>Item 5</li>
<li>Item 6</li>
<li>Item 7</li>
<li>Item 8</li>
<li>Item 9</li>
<li>Item 10</li>
<li>Item 11</li>
<li>Item 12</li>
<li>Item 13</li>
<li>Item 14</li>
<li>Item 15</li>
<li>Item 16</li>
<li>Item 17</li>
<li>Item 18</li>
<li>Item 19</li>
<li>Item 20</li>
<li>Item 21</li>
<li>Item 22</li>
<li>Item 23</li>
<li>Item 24</li>
<li>Item 25</li>
<li>Item 26</li>
<li>Item 27</li>
<li>Item 28</li>
<li>Item 29</li>
<li>Item 30</li>
<li>Item 31</li>
<li>Item 32</li>
<li>Item 33</li>
<li>Item 34</li>
<li>Item 35</li>
<li>Item 36</li>
<li>Item 37</li>
<li>Item 38</li>
<li>Item 39</li>
<li>Item 40</li>
<li>Item 41</li>
<li>Item 42</li>
<li>Item 43</li>
<li>Item 44</li>
<li>Item 45</li>
<li>Item 46</li>
<li>Item 47</li>
<li>Item 48</li>
<li>Item 49</li>
<li>Item 50</li>
</ul>

<MeasureComponent />

<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
<li>Item 4</li>
<li>Item 5</li>
<li>Item 6</li>
<li>Item 7</li>
<li>Item 8</li>
<li>Item 9</li>
<li>Item 10</li>
<li>Item 11</li>
<li>Item 12</li>
<li>Item 13</li>
<li>Item 14</li>
<li>Item 15</li>
<li>Item 16</li>
<li>Item 17</li>
<li>Item 18</li>
<li>Item 19</li>
<li>Item 20</li>
<li>Item 21</li>
<li>Item 22</li>
<li>Item 23</li>
<li>Item 24</li>
<li>Item 25</li>
<li>Item 26</li>
<li>Item 27</li>
<li>Item 28</li>
<li>Item 29</li>
<li>Item 30</li>
<li>Item 31</li>
<li>Item 32</li>
<li>Item 33</li>
<li>Item 34</li>
<li>Item 35</li>
<li>Item 36</li>
<li>Item 37</li>
<li>Item 38</li>
<li>Item 39</li>
<li>Item 40</li>
<li>Item 41</li>
<li>Item 42</li>
<li>Item 43</li>
<li>Item 44</li>
<li>Item 45</li>
<li>Item 46</li>
<li>Item 47</li>
<li>Item 48</li>
<li>Item 49</li>
<li>Item 50</li>
</ul>

</template>
